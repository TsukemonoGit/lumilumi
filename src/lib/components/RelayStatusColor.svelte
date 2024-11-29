<script lang="ts">
  import { cleanRelayUrl, getColor } from "$lib/func/util";
  import { Circle } from "lucide-svelte";
  import Popover from "./Elements/Popover.svelte";
  import { relayStateMap } from "$lib/stores/stores";

  interface Props {
    relay: string;
  }

  let { relay }: Props = $props();
  let relayUrl = $derived(cleanRelayUrl(relay)); // /がついてるほう
</script>

<Popover ariaLabel={`${relay} status`}>
  <Circle
    size="20"
    class="{getColor(
      $relayStateMap.get(relayUrl)
    )} fill-current  min-w-[20px] mr-1"
  />
  {#snippet popoverContent()}
    <div  class="mr-8">
      {$relayStateMap.get(relayUrl)}
    </div>
  {/snippet}</Popover
>
