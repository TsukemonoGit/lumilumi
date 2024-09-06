<script lang="ts">
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { extractKind9734 } from "$lib/func/makeZap";
  import { getFollowingList } from "$lib/func/nostr";
  import { onlyFollowee } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import { writable } from "svelte/store";

  export let events: Nostr.Event<number>[];
  const followFilteredEvents = writable<Nostr.Event[]>();
  export let value: {
    update: (
      updater: import("svelte/store").Updater<string | string[] | undefined>,
      sideEffect?:
        | ((newValue: string | string[] | undefined) => void)
        | undefined
    ) => void;
    set: (this: void, value: string | string[] | undefined) => void;
    subscribe(
      this: void,
      run: import("svelte/store").Subscriber<string | string[] | undefined>,
      invalidate?:
        | import("svelte/store").Invalidator<string | string[] | undefined>
        | undefined
    ): import("svelte/store").Unsubscriber;
    get: () => string | string[] | undefined;
    destroy?: (() => void) | undefined;
  };

  export const getFollowFilteredEvents = (
    events: Nostr.Event[],
    onlyFollowee: boolean
  ) => {
    const followee = getFollowingList();
    if (onlyFollowee && followee) {
      return events.filter((event) => {
        if (event.kind !== 9735) {
          return followee.includes(event.pubkey);
        } else {
          const kind9734 = extractKind9734(event);
          return kind9734 && followee.includes(kind9734.pubkey);
        }
      });
    } else {
      return events;
    }
  };

  $: $followFilteredEvents = getFollowFilteredEvents(events, $onlyFollowee);

  // 複数の選択に対応したフィルタリングロジック
  const getFilteredEvents = (
    events: Nostr.Event[],
    selectedStates: string | string[] | undefined
  ): Nostr.Event[] => {
    if (!selectedStates || typeof selectedStates === "string") return events;
    return events.filter((event) => {
      return selectedStates.some((state) => {
        switch (state) {
          case "reply":
            return event.kind === 1;
          case "reaction":
            return event.kind === 7;
          case "repost":
            return event.kind === 6 || event.kind === 16;
          case "zap":
            return event.kind === 9735;
          case "other":
            return event.kind === 42;
          default:
            return false;
        }
      });
    });
  };
</script>

{#if $followFilteredEvents && $followFilteredEvents.length > 0}
  {#each getFilteredEvents($followFilteredEvents, $value) as event, index (event.id)}
    <Metadata
      queryKey={["metadata", event.pubkey]}
      pubkey={event.pubkey}
      let:metadata
    >
      <div slot="loading" class="w-full">
        <EventCard note={event} />
      </div>
      <div slot="nodata" class="w-full">
        <EventCard note={event} />
      </div>
      <div slot="error" class="w-full">
        <EventCard note={event} />
      </div>
      <EventCard {metadata} note={event} /></Metadata
    >
  {/each}
{/if}
