<script lang="ts">
  import { defaultRelays, relayStateMap } from "$lib/stores/stores";
  import { Circle, RadioTower, RefreshCcw } from "lucide-svelte";
  import Popover from "./Elements/Popover.svelte";
  import { reconnectRelay } from "$lib/func/nostr";
  import { cleanRelayUrl, getColor } from "$lib/func/util";
  import RelayStatusColor from "./RelayStatusColor.svelte";
  import { rxNostr3RelaysReconnectChallenge } from "$lib/func/reactions";

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
  $: console.log($defaultRelays);
  $: readRelays = $defaultRelays
    ? Object.values($defaultRelays).filter((config) => config.read)
    : [];
  $: writeRelays = $defaultRelays
    ? Object.values($defaultRelays).filter((config) => config.write)
    : [];
  let open: boolean;

  let overallStateColor: string;

  // allStatus 内の state を設定する関数
  function setAllStatusState() {
    const allStatus = [...readRelays, ...writeRelays].map((relay) =>
      $relayStateMap.get(cleanRelayUrl(relay.url))
    );

    const stateCount: Record<string, number> = {};
    allStatus.forEach((state) => {
      // console.log(state);
      if (state) {
        stateCount[state] = (stateCount[state] || 0) + 1;
      }
    });

    let maxCount = 0;
    let overallState = "initialized"; // デフォルトは接続中とする

    for (const [state, count] of Object.entries(stateCount)) {
      //  console.log(state);
      if (count > maxCount) {
        maxCount = count;
        overallState = state;
      }
    }

    overallStateColor = getColor(overallState);
    //console.log(overallStateColor);
  }

  $: if ($relayStateMap) {
    if (readRelays?.length > 0 || writeRelays?.length > 0) {
      setAllStatusState();
    }
  }
  // function getOverallConnectionState(): string {
  //   const relayStates = [...readRelays, ...writeRelays].map(
  //     (relay) => $app.rxNostr.getRelayStatus(relay.url)?.connection
  //   );

  //   const stateCount: Record<string, number> = {};
  //   relayStates.forEach((state) => {
  //     if (state) {
  //       stateCount[state] = (stateCount[state] || 0) + 1;
  //     }
  //   });

  //   let maxCount = 0;
  //   let overallState = "connected"; // デフォルトは接続中とする

  //   for (const [state, count] of Object.entries(stateCount)) {
  //     if (count > maxCount) {
  //       maxCount = count;
  //       overallState = state;
  //     }
  //   }

  //   return overallState;
  // }
  // let overallStateColor: string;
  // afterUpdate(updateOverallStateColor);
  // function updateOverallStateColor() {
  //   if ($app?.rxNostr && $app.rxNostr.getAllRelayStatus()) {
  //     overallStateColor =
  //       !readRelays || !writeRelays
  //         ? getColor("initialized")
  //         : getColor(getOverallConnectionState());
  //   }
  // }
  let disabledButton: string | undefined;
  const handleClickReconnect = (url: string) => {
    reconnectRelay(url);
    // rxNostr3ReccoctRelay(url);
    rxNostr3RelaysReconnectChallenge();
    //リアクションの方の接続情報がわからないから全体のリコネクトチャレンジする
    disabledButton = url;
    setTimeout(() => {
      disabledButton = undefined;
      //updateOverallStateColor(); // 状態を更新
      //  rxNostr3Status();
    }, 3000);
  };
</script>

<!--reconnect relayは readable default relayだけ-->
<Popover bind:open ariaLabel={"relays status"}>
  <RadioTower size="20" class={overallStateColor} />

  <div slot="popoverContent" class="max-h-80 overflow-x-auto max-w-80">
    <div>
      <div class="text-magnum-200 font-bold text-lg mt-2">read</div>
      <ul>
        {#each readRelays as relay, index}
          {@const relayUrl = cleanRelayUrl(relay.url)}
          <li class="flex align-middle items-center break-all">
            <RelayStatusColor relay={relay.url} /><span class="inline w-60"
              >{relayUrl}</span
            >
            {#if $relayStateMap.get(relayUrl) === "error"}<button
                on:click={() => handleClickReconnect(relayUrl)}
                class="rounded-full bg-neutral-100 hover:opacity-75 active:opacity-50 disabled:opacity-25 w-[20px] h-[20px] flex justify-center items-center"
                disabled={relayUrl === disabledButton}
                ><RefreshCcw class="text-magnum-700 " size={16} /></button
              >{/if}
          </li>
          <!-- <li class="flex align-middle items-center break-all">
            <RelayStatusColor3 relay={relay.url} /><span class="inline w-60"
              >{relayUrl}</span
            >
            {#if $relayStateMap3.get(relayUrl) === "error"}<button
                on:click={() => handleClickReconnect(relayUrl)}
                class="rounded-full bg-neutral-100 hover:opacity-75 active:opacity-50 disabled:opacity-25 w-[20px] h-[20px] flex justify-center items-center"
                disabled={relayUrl === disabledButton}
                ><RefreshCcw class="text-magnum-700 " size={16} /></button
              >{/if}
          </li> -->
        {/each}
      </ul>
      <div class="text-magnum-200 font-bold text-lg">write</div>
      <ul>
        {#each writeRelays as relay, index}
          {@const relayUrl = cleanRelayUrl(relay.url)}
          <li class="flex align-middle items-center break-all">
            <Popover ariaLabel={`${relay.url} status`}>
              <Circle
                size="20"
                class="{getColor(
                  $relayStateMap.get(relayUrl)
                )} fill-current  min-w-[20px] mr-1"
              />
              <div slot="popoverContent" class="mr-8">
                {$relayStateMap.get(relayUrl)}
              </div></Popover
            ><span class="inline w-60">{relayUrl}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div></Popover
>
