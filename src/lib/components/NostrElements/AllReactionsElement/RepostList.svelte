<script lang="ts">
  import UserPopupMenu from "$lib/components/Elements/UserPopupMenu.svelte";

  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import * as Nostr from "nostr-typedef";

  interface Props {
    events: Nostr.Event[];
    tieKey: string | undefined;
  }

  let { events, tieKey }: Props = $props();
</script>

{#each events as event (event.id)}
  <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
    {#snippet loading()}
      <UserPopupMenu
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
        {tieKey}
      />
    {/snippet}

    {#snippet error()}
      <UserPopupMenu
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
        {tieKey}
      />
    {/snippet}

    {#snippet nodata()}
      <UserPopupMenu
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
        {tieKey}
      />
    {/snippet}

    {#snippet content({ metadata })}
      <UserPopupMenu
        pubkey={event.pubkey}
        {metadata}
        size={24}
        depth={0}
        {tieKey}
      />
    {/snippet}
  </Metadata>
{/each}
