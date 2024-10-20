<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import ZapList from "./ZapList.svelte";

  export let events: Nostr.Event[];
  export let tieKey: string | undefined;
</script>

<CollapsibleList title="Zap" bind:amount={events.length}>
  <ZapList {events} {tieKey} />
</CollapsibleList>
