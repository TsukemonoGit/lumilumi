<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import ReactionList from "./ReactionList.svelte";
  import type { ReqStatus } from "$lib/types";

  interface Props {
    events: Nostr.Event[];
    status: ReqStatus;
  }

  let { events, status }: Props = $props();
</script>

<CollapsibleList title="Reaction" amount={events.length} {status}>
  <ReactionList {events} />
</CollapsibleList>
