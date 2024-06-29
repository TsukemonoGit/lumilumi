<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import PopupProfileIcon from "./PopupProfileIcon.svelte";
  import Collapsible from "$lib/components/Elements/Collapsible.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  export let events: Nostr.Event[];
</script>

<CollapsibleList title="Repost" bind:amount={events.length}>
  <div class="mx-2">
    {#each events as event (event.id)}
      <PopupProfileIcon pubkey={event.pubkey} />
    {/each}
  </div>
</CollapsibleList>
