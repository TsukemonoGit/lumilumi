<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import RepostList from "./RepostList.svelte";
  import type { ReqStatus } from "$lib/types";
  interface Props {
    events: Nostr.Event[];
    status: ReqStatus;
  }

  const { events, status }: Props = $props();
</script>

<CollapsibleList title="Repost" amount={events.length} {status}>
  <div class="mx-2">
    <RepostList {events} />
  </div>
</CollapsibleList>
