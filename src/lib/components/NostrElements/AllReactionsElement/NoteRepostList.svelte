<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";

  import RepostList from "./RepostList.svelte";
  interface Props {
    events: Nostr.Event[];
  }

  let { events }: Props = $props();
</script>

<CollapsibleList title="Repost" amount={events.length}>
  <div class="mx-2">
    <RepostList {events} />
  </div>
</CollapsibleList>
