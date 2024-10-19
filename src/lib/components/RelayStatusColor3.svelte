<script lang="ts">
  import { cleanRelayUrl, getColor } from "$lib/func/util";
  import { Circle } from "lucide-svelte";
  import Popover from "./Elements/Popover.svelte";
  import { relayStateMap, relayStateMap3 } from "$lib/stores/stores";

  export let relay: string;
  $: relayUrl = cleanRelayUrl(relay); // /がついてるほう
</script>

<Popover ariaLabel={`${relay} status`}>
  <Circle
    size="20"
    class="{getColor(
      $relayStateMap3.get(relayUrl)
    )} fill-current  min-w-[20px] mr-1"
  />
  <div slot="popoverContent" class="mr-8">
    {$relayStateMap3.get(relayUrl)}
  </div></Popover
>
