<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import ZapList from "./ZapList.svelte";
  import type { ReqStatus } from "$lib/types";

  interface Props {
    events: Nostr.Event[];
    status: ReqStatus;
  }

  let { events = $bindable(), status }: Props = $props();
</script>

<CollapsibleList title="Zap" amount={events.length} {status}>
  <ZapList {events} />
</CollapsibleList>
