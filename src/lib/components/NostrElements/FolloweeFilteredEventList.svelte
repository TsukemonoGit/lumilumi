<script lang="ts">
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import * as Nostr from "nostr-typedef";

  interface Props {
    events: Nostr.Event<number>[];
    tieKey: string;
  }

  let { events, tieKey }: Props = $props();
</script>

{#if events && events.length > 0}
  {#each events as event, index (event.id)}
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
  {/each}
{/if}
