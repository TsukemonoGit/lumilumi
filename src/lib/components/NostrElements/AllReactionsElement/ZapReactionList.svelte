<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import ZapList from "./ZapList.svelte";

  interface Props {
    events: Nostr.Event[];
    tieKey: string | undefined;
  }

  let { events = $bindable(), tieKey }: Props = $props();
</script>

<CollapsibleList title="Zap" amount={events.length}>
  <ZapList {events} {tieKey} />
</CollapsibleList>
