<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import PopupProfileIcon from "./PopupProfileIcon.svelte";
  import Collapsible from "$lib/components/Elements/Collapsible.svelte";
  export let events: Nostr.Event[];
</script>

<div class="border border-magnum-500 rounded-md break-all my-1 w-full">
  <Collapsible>
    <div slot="title" class="font-bold px-1">Repost {events.length}</div>
    <div slot="contentEle" class="px-4 py-1 flex flex-wrap gap-1">
      {#each events as event (event.id)}
        <PopupProfileIcon pubkey={event.pubkey} />
      {/each}
    </div>
  </Collapsible>
</div>
