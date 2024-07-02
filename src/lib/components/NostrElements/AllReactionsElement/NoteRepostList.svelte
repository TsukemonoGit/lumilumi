<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  export let events: Nostr.Event[];
</script>

<CollapsibleList title="Repost" bind:amount={events.length}>
  <div class="mx-2">
    {#each events as event (event.id)}
      <Metadata
        queryKey={["metadata", event.pubkey]}
        pubkey={event.pubkey}
        let:metadata
      >
        <UserMenu
          slot="loading"
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
        />

        <UserMenu
          slot="error"
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
        />

        <UserMenu
          slot="nodata"
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
        />

        <div><UserMenu pubkey={event.pubkey} {metadata} size={24} /></div>
      </Metadata>
    {/each}
  </div>
</CollapsibleList>
