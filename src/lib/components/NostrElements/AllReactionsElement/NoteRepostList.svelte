<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import RepostList from "./RepostList.svelte";
  export let events: Nostr.Event[];
  export let tieKey: string | undefined;
</script>

<CollapsibleList title="Repost" bind:amount={events.length}>
  <div class="mx-2">
    <RepostList {events} {tieKey} />
  </div>
</CollapsibleList>
