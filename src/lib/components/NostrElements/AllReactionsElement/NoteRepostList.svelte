<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  export let events: Nostr.Event[];
  export let tieKey: string | undefined;
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
          depth={0}
          {tieKey}
        />

        <UserMenu
          slot="error"
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
          depth={0}
          {tieKey}
        />

        <UserMenu
          slot="nodata"
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
          depth={0}
          {tieKey}
        />

        <UserMenu
          pubkey={event.pubkey}
          {metadata}
          size={24}
          depth={0}
          {tieKey}
        />
      </Metadata>
    {/each}
  </div>
</CollapsibleList>
