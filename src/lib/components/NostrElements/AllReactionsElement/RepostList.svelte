<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import * as Nostr from "nostr-typedef";
  import UserPopupMenu from "../user/UserPopupMenu.svelte";

  interface Props {
    events: Nostr.Event[];
  }

  let { events }: Props = $props();
</script>

{#each events as event (event.id)}
  <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
    {#snippet loading()}
      <UserPopupMenu
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
      />
    {/snippet}

    {#snippet error()}
      <UserPopupMenu
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
      />
    {/snippet}

    {#snippet nodata()}
      <UserPopupMenu
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
      />
    {/snippet}

    {#snippet content({ metadata })}
      <UserPopupMenu pubkey={event.pubkey} {metadata} size={24} depth={0} />
    {/snippet}
  </Metadata>
{/each}
