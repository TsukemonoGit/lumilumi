<script lang="ts">
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { extractKind9734 } from "$lib/func/makeZap";
  import { getFollowingList } from "$lib/func/nostr";
  import { onlyFollowee, showReactioninTL } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import { writable } from "svelte/store";

  export let events: Nostr.Event<number>[];
  const followFilteredEvents = writable<Nostr.Event[]>();

  export const getFollowFilteredEvents = (
    events: Nostr.Event[],
    onlyFollowee: boolean
  ) => {
    if (!$showReactioninTL) {
      return events;
    }
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
</script>

{#if $followFilteredEvents && $followFilteredEvents.length > 0}
  {#each $followFilteredEvents as event, index (event.id)}
    <!-- <div
                class="max-w-full break-words whitespace-pre-line box-border overflow-hidden event-card "
              > -->
    <Metadata
      queryKey={["metadata", event.pubkey]}
      pubkey={event.pubkey}
      let:metadata
    >
      <div slot="loading" class="w-full">
        <EventCard note={event} repostable={true} />
      </div>
      <div slot="nodata" class="w-full">
        <EventCard note={event} repostable={true} />
      </div>
      <div slot="error" class="w-full">
        <EventCard note={event} repostable={true} />
      </div>
      <EventCard {metadata} note={event} repostable={true} />
    </Metadata>
    <!-- </div> -->
  {/each}
{/if}
