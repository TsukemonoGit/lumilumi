import {
  createRxBackwardReq,
  uniq,
  completeOnTimeout,
  type RxNostr,
} from "rx-nostr";
import { sortEvents } from "$lib/func/util";
import type * as Nostr from "nostr-typedef";

export function createNeighborFeed(
  rxNostr: RxNostr,
  targetEvent: Nostr.Event,
  authors: string[]
) {
  let olderEvents = $state<Nostr.Event[]>([]);
  let newerEvents = $state<Nostr.Event[]>([]);
  let isLoadingOlder = $state(false);
  let isLoadingNewer = $state(false);

  let oldestLoaded = $state(targetEvent.created_at);
  let newestLoaded = $state(targetEvent.created_at);

  // Initial offset to ensure we don't fetch targetEvent itself if possible,
  // but time granularity is seconds, so duplicate filtering is necessary anyway.

  function loadOlder() {
    if (isLoadingOlder) return;
    isLoadingOlder = true;

    const req = createRxBackwardReq("feed-older");
    const limit = 50;
    const until = oldestLoaded;

    const filters = [
      {
        kinds: [1, 6],
        authors: authors,
        until: until,
        limit: limit,
      },
    ];

    let events: Nostr.Event[] = [];

    rxNostr
      .use(req)
      .pipe(uniq(), completeOnTimeout(3000))
      .subscribe({
        next: (packet) => {
          if (packet?.event && packet.event.id !== targetEvent.id) {
            events.push(packet.event);
          }
        },
        complete: () => {
          const sorted = sortEvents(events).slice(0, limit);
          // Filter duplicates against existing
          const uniqueNew = sorted.filter(
            (e) => !olderEvents.find((existing) => existing.id === e.id)
          );

          if (uniqueNew.length > 0) {
            olderEvents = [...olderEvents, ...uniqueNew];
            oldestLoaded = uniqueNew[uniqueNew.length - 1].created_at - 1;
          }
          isLoadingOlder = false;
        },
        error: (e) => {
          console.error(e);
          isLoadingOlder = false;
        },
      });

    req.emit(filters);
  }

  function loadNewer() {
    if (isLoadingNewer) return;
    isLoadingNewer = true;

    const baseTime = newestLoaded;
    const t0 = baseTime;
    const t1 = baseTime + 60 * 20; // 20 mins

    const req = createRxBackwardReq("feed-newer");

    const filters = [
      {
        kinds: [1, 6],
        authors: authors,
        since: t0,
        until: t1,
      },
    ];

    let events: Nostr.Event[] = [];

    rxNostr
      .use(req)
      .pipe(uniq(), completeOnTimeout(3000))
      .subscribe({
        next: (p) => events.push(p.event),
        complete: () => {
          const sorted = sortEvents(events); // Descending (Newest first) in chunk

          // newerEvents are displayed above target.
          // We append the new chunk (which is chronologically newer than existing) to the FRONT/TOP of the list?
          // Wait.
          // `newerEvents` list: Top = Newest.
          // If we have [A, B] (A is newer than B).
          // We fetch [C, D] (C newer than D, both newer than A).
          // We want [C, D, A, B].
          // `sorted` is [C, D].
          // newerEvents = [...sorted, ...newerEvents].

          const uniqueNew = sorted.filter(
            (e) =>
              !newerEvents.find((existing) => existing.id === e.id) &&
              e.id !== targetEvent.id
          );

          if (uniqueNew.length > 0) {
            newerEvents = [...uniqueNew, ...newerEvents];
            // Update cursor to the NEWEST event we just found (which is at index 0 of sorted)
            // Because sorted is Descending (Newest first).
            // Next fetch will start from this time.
            newestLoaded = sorted[0].created_at;
          } else {
            // If no events found, maybe we are at the top?
            // Or maybe we should just slightly increment to avoid getting stuck?
            // For 'since' without until, getting 0 means no newer events exist at all.
            // So we don't need to advance aggressively.
          }
          isLoadingNewer = false;
        },
        error: (e) => {
          console.error(e);
          isLoadingNewer = false;
        },
      });

    req.emit(filters);
  }

  // Initial Load?
  // We can call loadOlder/Newer manually.

  return {
    get olderEvents() {
      return olderEvents;
    },
    get newerEvents() {
      return newerEvents;
    },
    get isLoadingOlder() {
      return isLoadingOlder;
    },
    get isLoadingNewer() {
      return isLoadingNewer;
    },
    get oldestLoaded() {
      return oldestLoaded;
    },
    get newestLoaded() {
      return newestLoaded;
    },
    loadOlder,
    loadNewer,
  };
}
