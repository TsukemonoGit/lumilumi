<script lang="ts">
  import EventCard from "$lib/components/NostrElements/Note/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import * as Nostr from "nostr-typedef";

  interface Props {
    events: Nostr.Event<number>[];
    tieKey: string; // const followFilteredEvents = writable<Nostr.Event[]>();
  }

  let { events, tieKey }: Props = $props();

  // export const getFollowFilteredEvents = (
  //   events: Nostr.Event[],
  //   onlyFollowee: boolean
  // ) => {
  //   if (!$showReactioninTL) {
  //     return events;
  //   }
  //   const followee = getFollowingList();
  //   if (onlyFollowee && followee) {
  //     return events.filter((event) => {
  //       if (event.kind !== 9735) {
  //         return followee.includes(event.pubkey);
  //       } else {
  //         const kind9734 = extractKind9734(event);
  //         return kind9734 && followee.includes(kind9734.pubkey);
  //       }
  //     });
  //   } else {
  //     return events;
  //   }
  // };

  // $: $followFilteredEvents = getFollowFilteredEvents(events, $onlyFollowee);
</script>

{#if events && events.length > 0}
  {#each events as event, index (event.id)}
    <!-- <div
                class="max-w-full break-words whitespace-pre-line box-border overflow-hidden event-card "
              > -->
    <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
      {#snippet loading()}
        <div class="w-full">
          <EventCard note={event} repostable={true} {tieKey} />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div class="w-full">
          <EventCard note={event} repostable={true} {tieKey} />
        </div>
      {/snippet}
      {#snippet error()}
        <div class="w-full">
          <EventCard note={event} repostable={true} {tieKey} />
        </div>
      {/snippet}
      {#snippet content({ metadata })}
        <EventCard {metadata} note={event} repostable={true} {tieKey} />
      {/snippet}
    </Metadata>
    <!-- </div> -->
  {/each}
{/if}
