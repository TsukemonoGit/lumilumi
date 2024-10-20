<script lang="ts">
  import UserPopupMenu from "$lib/components/Elements/UserPopupMenu.svelte";

  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import * as Nostr from "nostr-typedef";

  export let events: Nostr.Event[];
  export let tieKey: string | undefined;
</script>

{#each events as event (event.id)}
  <Metadata
    queryKey={["metadata", event.pubkey]}
    pubkey={event.pubkey}
    let:metadata
  >
    <UserPopupMenu
      slot="loading"
      pubkey={event.pubkey}
      metadata={undefined}
      size={24}
      depth={0}
      {tieKey}
    />

    <UserPopupMenu
      slot="error"
      pubkey={event.pubkey}
      metadata={undefined}
      size={24}
      depth={0}
      {tieKey}
    />

    <UserPopupMenu
      slot="nodata"
      pubkey={event.pubkey}
      metadata={undefined}
      size={24}
      depth={0}
      {tieKey}
    />

    <UserPopupMenu
      pubkey={event.pubkey}
      {metadata}
      size={24}
      depth={0}
      {tieKey}
    />
  </Metadata>
{/each}
