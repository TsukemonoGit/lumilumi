<script lang="ts">
  import { app, defaultRelays } from "$lib/stores/stores";
  import { Share2, Circle } from "lucide-svelte";
  import Popover from "./Elements/Popover.svelte";
  import { afterUpdate } from "svelte";

  //ConnectionState
  // | "initialized"
  // | "connecting"
  // | "connected"
  // | "waiting-for-retrying"
  // | "retrying"
  // | "dormant"
  // | "error"
  // | "rejected"
  // | "terminated";

  $: readRelays = $defaultRelays
    ? Object.values($defaultRelays).filter((config) => config.read)
    : [];
  $: writeRelays = $defaultRelays
    ? Object.values($defaultRelays).filter((config) => config.write)
    : [];
  let open: boolean;

  function getColor(state: string | undefined): string {
    switch (state) {
      case "initialized":
        return "text-gray-500";
      case "connecting":
        return "text-blue-500";
      case "connected":
        return "text-green-500";
      case "waiting-for-retrying":
      case "retrying":
        return "text-yellow-500";
      case "dormant":
        return "text-purple-500";
      case "error":
      case "rejected":
      case "terminated":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }
  function getOverallConnectionState(): string {
    const relayStates = [...readRelays, ...writeRelays].map(
      (relay) => $app.rxNostr.getRelayStatus(relay.url)?.connection
    );

    const stateCount: Record<string, number> = {};
    relayStates.forEach((state) => {
      if (state) {
        stateCount[state] = (stateCount[state] || 0) + 1;
      }
    });

    let maxCount = 0;
    let overallState = "connected"; // デフォルトは接続中とする

    for (const [state, count] of Object.entries(stateCount)) {
      if (count > maxCount) {
        maxCount = count;
        overallState = state;
      }
    }

    return overallState;
  }
  let overallStateColor: string;
  afterUpdate(() => {
    if ($app?.rxNostr && $app.rxNostr.getAllRelayStatus()) {
      overallStateColor =
        !readRelays || !writeRelays
          ? getColor("initialized")
          : getColor(getOverallConnectionState());
    }
  });
</script>

<Popover bind:open>
  <div class="flex justify-center h-[3em] items-center">
    <Share2 size="20" class={overallStateColor} />
  </div>
  <div slot="popoverContent" class="max-h-80 overflow-x-auto max-w-72">
    <div>
      <div class="text-magnum-200 font-bold text-lg mt-2">read</div>
      <ul>
        {#each readRelays as relay, index}
          <li class="flex align-middle items-center break-all">
            <Popover>
              <Circle
                size="20"
                class="{getColor(
                  $app.rxNostr.getRelayStatus(relay.url)?.connection
                )} fill-current  min-w-[20px] mr-1"
              />
              <div slot="popoverContent" class="mr-8">
                {$app.rxNostr.getRelayStatus(relay.url)?.connection}
              </div></Popover
            ><span class="inline w-60">{relay.url}</span>
          </li>
        {/each}
      </ul>
      <div class="text-magnum-200 font-bold text-lg">write</div>
      <ul>
        {#each writeRelays as relay, index}
          <li class="flex align-middle items-center break-all">
            <Popover>
              <Circle
                size="20"
                class="{getColor(
                  $app.rxNostr.getRelayStatus(relay.url)?.connection
                )} fill-current  min-w-[20px] mr-1"
              />
              <div slot="popoverContent" class="mr-8">
                {$app.rxNostr.getRelayStatus(relay.url)?.connection}
              </div></Popover
            ><span class="inline w-60">{relay.url}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div></Popover
>
