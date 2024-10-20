<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import ReactionList from "./ReactionList.svelte";

  export let events: Nostr.Event[];
  export let tieKey: string | undefined;
</script>

<CollapsibleList title="Reaction" bind:amount={events.length}>
  <ReactionList {events} {tieKey} />
</CollapsibleList>
