import type { EventPacket } from "rx-nostr";
import { latestEach } from "rx-nostr";
import type { OperatorFunction } from "rxjs";
import { filter, from, map, mergeMap, pipe, scan, tap } from "rxjs";
import { metadataQueue, queryClient, reactionToast } from "./stores";

import * as Nostr from "nostr-typedef";
import { sortEventPackets } from "$lib/func/util";
import { type QueryKey } from "@tanstack/svelte-query";

import { muteCheck, muteCheck as muteCheckEvent } from "$lib/func/muteCheck";
import {
  bookmark10003,
  followList,
  lumiSetting,
  notifiSettings,
  timelineFilter,
  userStatusMap,
} from "$lib/stores/globalRunes.svelte";
import { SvelteMap } from "svelte/reactivity";
import { isAddressableKind, isReplaceableKind } from "nostr-tools/kinds";
import { urlRegex } from "$lib/func/regex";
import { userPromiseUrl } from "$lib/func/useUrl";
import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

export function createTie<P extends EventPacket>(): [
  OperatorFunction<P, P & { seenOn: Set<string>; isNew: boolean }>,
  Map<string, Set<string>>,
] {
  // [修正] LRU上限付き: 最大5000件、超過時は最古エントリを削除
  const MAX_TIE_SIZE = 5000;
  const memo = new Map<string, Set<string>>();

  return [
    pipe(
      map((packet) => {
        if (!packet?.event) {
          const seenOn = new Set<string>();
          return {
            ...packet,
            seenOn,
            isNew: false,
          } as P & { seenOn: Set<string>; isNew: boolean };
        }

        const seenOn = memo.get(packet.event.id) ?? new Set<string>();
        const isNew = seenOn.size <= 0;

        if (!memo.get(packet.event.id)?.has(packet.from)) {
          seenOn.add(packet.from);
          // [修正] 新規エントリの場合のみサイズチェック
          if (!memo.has(packet.event.id)) {
            if (memo.size >= MAX_TIE_SIZE) {
              memo.delete(memo.keys().next().value!);
            }
          }
          memo.set(packet.event.id, seenOn);
        }

        return {
          ...packet,
          seenOn,
          isNew,
        };
      }),
    ),
    memo,
  ];
}

export function filterId(
  id: string,
): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet) => !!packet?.event && packet.event.id === id);
}

export function filterTextList(
  ids: string[],
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) => !!event && event.kind === 1 && ids.includes(event.id),
  );
}

export function filterPubkey(
  pubkey: string,
): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet) => !!packet?.event && packet.event.pubkey === pubkey);
}

export function filterMetadataList(
  pubkeys: string[],
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) =>
      !!event && event.kind === 0 && pubkeys.includes(event.pubkey),
  );
}

export function filterNaddr(
  kind: number,
  pubkey: string,
  identifier: string,
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) =>
      !!event &&
      event.kind === kind &&
      event.pubkey === pubkey &&
      !!event.tags?.[0]?.[1] &&
      event.tags.find((tag) => tag[0] === "d")?.[1] === identifier,
  );
}

export function latestEachPubkey(): OperatorFunction<EventPacket, EventPacket> {
  return latestEach(({ event }) => event.pubkey);
}

export function latestEachNaddr(): OperatorFunction<EventPacket, EventPacket> {
  return pipe(
    filter((packet) => !!packet?.event),
    latestEach(
      ({ event }) => `${event.kind}:${event.pubkey}:${event.tags[0][1]}`,
    ),
  );
}

const createEventQueryKey = (ev: Nostr.Event): QueryKey | null => {
  if (ev.kind === 0) {
    return null;
  } else if (isAddressableKind(ev.kind) && isReplaceableKind(ev.kind)) {
    return [
      "naddr",
      `${ev.kind}:${ev.pubkey}:${
        ev.tags.find((tag) => tag[0] === "d")?.[1] || ""
      }`,
    ] as QueryKey;
  } else if (ev.id) {
    return ["note", ev.id] as QueryKey;
  }
  return null;
};

export function saveEachNote(): OperatorFunction<EventPacket, EventPacket> {
  return tap((pk: EventPacket) => {
    if (pk.event && pk.event.id) {
      const queryKey: QueryKey | null = createEventQueryKey(pk.event);
      if (queryKey && !queryClient.getQueryData(queryKey)) {
        queryClient.setQueryData(queryKey, pk);
      }
    }
  });
}

export function scanArray<A extends EventPacket>(
  sift?: number,
): OperatorFunction<A, A[]> {
  return scan((acc: A[], a: A) => {
    const sorted = sortEventPackets([...acc, a]);
    if (sift !== undefined) {
      return sorted.slice(0, sift === 0 ? undefined : sift);
    }
    return sorted;
  }, []);
}

export function metadata(): OperatorFunction<EventPacket, EventPacket> {
  return tap((event: EventPacket) => {
    if (event.event?.kind === 0) {
      metadataQueue.update((queue) => [
        ...queue,
        [["metadata", event.event.pubkey], event],
      ]);
    }
  });
}

export function bookmark(): OperatorFunction<EventPacket, EventPacket> {
  return tap((pk: EventPacket) => {
    if (!pk?.event) return;
    if (
      pk.event.kind === 10003 &&
      pk.event.pubkey === lumiSetting.get().pubkey
    ) {
      const queryKey: QueryKey = ["naddr", `${10003}:${pk.event.pubkey}:`];

      const preMeta: EventPacket | undefined =
        queryClient.getQueryData(queryKey);
      if (!preMeta || pk.event.created_at > preMeta.event.created_at) {
        queryClient.setQueryData(queryKey, pk);
        localStorage?.setItem(STORAGE_KEYS.BOOKMARK, JSON.stringify(pk));
        bookmark10003.set(pk.event);
      }
    }
  });
}

export function userStatus(): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet: EventPacket) => {
    if (!packet?.event || packet.event.kind !== 30315) {
      return true;
    }

    const dtag = packet.event.tags.find((tag) => tag[0] === "d")?.[1];
    if (!dtag) {
      return false;
    }

    const pubkeyMap = userStatusMap.get(packet.event.pubkey);
    const pre: Nostr.Event | undefined = pubkeyMap?.get(dtag);

    if (!pre || packet.event.created_at > pre.created_at) {
      let targetMap = userStatusMap.get(packet.event.pubkey);
      if (!targetMap) {
        targetMap = new SvelteMap<string, Nostr.Event>();
        userStatusMap.set(packet.event.pubkey, targetMap);
      }

      targetMap.set(dtag, packet.event);
    }

    return false;
  });
}

export function latestbyId<A extends EventPacket>(): OperatorFunction<A, A[]> {
  return pipe(
    scan((acc: Map<string, A>, eventPacket: A) => {
      if (eventPacket?.event) {
        const tagValue = getTagValue(eventPacket, "d");
        if (tagValue) {
          const existingPacket = acc.get(tagValue);
          if (
            !existingPacket ||
            existingPacket.event.created_at < eventPacket.event.created_at
          ) {
            acc.set(tagValue, eventPacket);
          }
        }
      }
      return acc;
    }, new Map<string, A>()),
    map((acc) => Array.from(acc.values())),
  );
}

function getTagValue(
  eventPacket: EventPacket,
  tagKey: string,
): string | undefined {
  const tag = eventPacket.event?.tags?.find((tag) => tag[0] === tagKey);
  return tag ? tag[1] : undefined;
}

export function zapCheck() {
  return filter((pk: EventPacket) => {
    if (!pk?.event || pk.event.kind !== 9735) {
      return true;
    }

    const pub = pk.event.tags.find((tag) => tag[0] === "p")?.[1];
    if (pub === lumiSetting.get().pubkey) {
      return true;
    } else {
      return false;
    }
  });
}

export const zappedPubkey = (event: Nostr.Event): string | undefined => {
  try {
    return JSON.parse(
      event.tags.find((tag) => tag[0] === "description")?.[1] ?? "",
    ).pubkey;
  } catch (error) {
    return undefined;
  }
};

export function reactionCheck(show: boolean) {
  return filter((packet: EventPacket) => {
    if (!packet?.event) return false;
    const { event } = packet;
    const loginUserPubkey = lumiSetting.get().pubkey;

    const isFollowingUser = (pubkey: string): boolean =>
      followList.get()?.has(pubkey) ?? false;

    const isSelfPost = event.pubkey === loginUserPubkey;

    const containsUserTag = event.tags.some(
      (tag) => tag[0] === "p" && tag[1] === loginUserPubkey,
    );

    const isTargetEventKind = [1, 6, 16, 42].includes(event.kind);

    const isReactionEvent =
      !isTargetEventKind && containsUserTag && !isSelfPost;

    const maybeSetReaction = (canShow: boolean) => {
      if (show && canShow) {
        setReactionEvent(packet);
      }
    };

    if (isTargetEventKind) {
      if (!isSelfPost && containsUserTag) {
        const isFollower = isFollowingUser(event.pubkey);

        if (isFollower) {
          maybeSetReaction(muteCheckEvent(event) === "null");
          return true;
        } else {
          const canShow =
            muteCheckEvent(event) === "null" && !notifiSettings.onlyFollowee;
          maybeSetReaction(canShow);
          return false;
        }
      } else {
        return true;
      }
    }

    if (isReactionEvent) {
      const isFollower = isFollowingUser(event.pubkey);
      const canShow = isFollower || !notifiSettings.onlyFollowee;
      maybeSetReaction(canShow);
    }

    return false;
  });
}

// [修正] LRU上限付き: 最大5000件、超過時は最古エントリを削除
const MAX_OBSERVED_SIZE = 5000;
const observedEvents = new Set<string>();

function addObservedEvent(id: string): void {
  if (observedEvents.size >= MAX_OBSERVED_SIZE) {
    observedEvents.delete(observedEvents.values().next().value!);
  }
  observedEvents.add(id);
}

function setReactionEvent(packet: EventPacket) {
  if (!packet?.event) return;
  if (observedEvents.has(packet.event.id)) {
    return;
  }

  if (!timelineFilter.adaptMute || muteCheck(packet.event) === "null") {
    // [修正] 上限付き追加関数を使用
    addObservedEvent(packet.event.id);

    reactionToast.set({
      title: "",
      description: JSON.stringify(packet.event),
      color: "",
    });
  }
}

const mediaTypes = ["image", "svg", "movie", "audio", "3D"] as const;
type MediaType = (typeof mediaTypes)[number];

export interface MediaResult {
  eventPacket: EventPacket;
  mediaUrl: string;
  mediaType: MediaType;
}

export interface MediaOperatorState {
  result: MediaResult;
  oldestCreatedAt: number;
  totalPacketsProcessed: number;
}
export interface MediaOperatorOutput {
  result: MediaResult[];
  oldestCreatedAt: number;
  totalPacketsProcessed: number;
}

export interface MediaEvent {
  eventPacket: EventPacket;
  mediaUrl: string;
  mediaType: MediaType;
}

const extractMediaUrls = (content: string): string[] => {
  const urls = content.match(urlRegex) || [];
  return urls.filter((url) => url.length > 0);
};

export const mediaOperator = (sift: number) => {
  let eventBuffer: EventPacket[] = [];

  return pipe(
    mergeMap((eventPacket: EventPacket) => {
      if (!eventPacket?.event) {
        return from([]);
      }

      eventBuffer.push(eventPacket);

      if (sift !== 0 && eventBuffer.length >= sift) {
        eventBuffer = sortEventPackets(eventBuffer).slice(0, sift);
      }

      const urls = extractMediaUrls(eventPacket.event.content ?? "");

      return from(urls).pipe(
        mergeMap(async (url) => {
          const mediaType = await userPromiseUrl(url);
          if (mediaType && mediaTypes.includes(mediaType as MediaType)) {
            return {
              eventPacket,
              mediaUrl: url,
              mediaType: mediaType as MediaType,
              createdAt: eventPacket.event.created_at,
            };
          }
          return null;
        }),
        filter(
          (result): result is MediaResult & { createdAt: number } =>
            result !== null,
        ),
        map((result) => ({
          result,
          oldestCreatedAt:
            sift !== 0 && eventBuffer.length >= sift
              ? eventBuffer[sift - 1].event.created_at
              : eventBuffer[eventBuffer.length - 1].event.created_at,
          totalPacketsProcessed: eventBuffer.length,
        })),
      );
    }),
  );
};
