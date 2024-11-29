<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import ReactionList from "./ReactionList.svelte";

  interface Props {
    events: Nostr.Event[];
    tieKey: string | undefined;
  }

  let { events = $bindable(), tieKey }: Props = $props();
</script>

<CollapsibleList title="Reaction" bind:amount={events.length}>
  <ReactionList {events} {tieKey} />
</CollapsibleList>
