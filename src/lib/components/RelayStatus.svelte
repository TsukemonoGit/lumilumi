<script lang="ts">
  import { defaultRelays } from "$lib/stores/stores";
  import { Circle, RadioTower, RefreshCcw } from "lucide-svelte";
  import Popover from "./Elements/Popover.svelte";
  import { reconnectRelay } from "$lib/func/nostr";
  import { cleanRelayUrl, getColor } from "$lib/func/util";
  import RelayStatusColor from "./RelayStatusColor.svelte";
  import { rxNostr3ReccoctRelay } from "$lib/func/reactions";

  import { relayStateMap } from "$lib/stores/globalRunes.svelte";
  import type { ConnectionState } from "rx-nostr";

  const readRelays = $derived(
    $defaultRelays
      ? Object.values($defaultRelays).filter((config) => config.read)
      : []
  );
  const writeRelays = $derived(
    $defaultRelays
      ? Object.values($defaultRelays).filter((config) => config.write)
      : []
  );

  const overallStateColor: string = $derived.by(() => setAllStatusState());
  // allStatus 内の state を設定する関数
  function setAllStatusState(): string {
    const allStatus = [...readRelays, ...writeRelays].map((relay) =>
      relayStateMap.get().get(cleanRelayUrl(relay.url))
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

    return getColor(overallState);
    //console.log(overallStateColor);
  }

  let disabledButton: string | undefined = $state();
  const handleClickReconnect = (url: string) => {
    reconnectRelay(url);
    rxNostr3ReccoctRelay(url);
    // rxNostr3RelaysReconnectChallenge();
    //リアクションの方の接続情報がわからないから全体のリコネクトチャレンジする
    disabledButton = url;
    setTimeout(() => {
      disabledButton = undefined;
      //updateOverallStateColor(); // 状態を更新
      //  rxNostr3Status();
    }, 3000);
  };
  // エラー状態として扱う状態のリスト
  const errorStates: ConnectionState[] = ["error", "rejected", "terminated"];
  let errorRelayCount: number = $state(0);
  relayStateMap.subscribe((value) => {
    //   stateが "error" 、"rejected"、 "terminated"のリレーの数を数える
    errorRelayCount = [...value.values()].filter((state) =>
      errorStates.includes(state)
    ).length;
  });
</script>

<!--reconnect relayは readable default relayだけ-->
<Popover ariaLabel="relays status">
  <div class="flex gap-0.5 items-end">
    <RadioTower
      size="20"
      class={`${overallStateColor}  hover:opacity-75 active:opacity-50`}
    />
    <div class="font-bold text-xs text-red-500">
      {errorRelayCount !== 0 ? errorRelayCount : ""}
    </div>
  </div>

  {#snippet popoverContent()}
    <div class="max-h-80 overflow-x-auto max-w-80">
      <div>
        <div class="text-magnum-200 font-bold text-lg mt-2">read</div>
        <ul>
          {#each readRelays as relay, index}
            {@const relayUrl = cleanRelayUrl(relay.url)}
            <li class="flex align-middle items-center break-all">
              <RelayStatusColor relay={relay.url} /><span class="inline w-60"
                >{relayUrl}</span
              >
              {#if relayStateMap.get().get(relayUrl) === "error"}<button
                  onclick={() => handleClickReconnect(relayUrl)}
                  class="rounded-full bg-neutral-100 hover:opacity-75 active:opacity-50 disabled:opacity-25 w-[20px] h-[20px] flex justify-center items-center"
                  disabled={relayUrl === disabledButton}
                  ><RefreshCcw class="text-magnum-700 " size={16} /></button
                >{/if}
            </li>
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
                    relayStateMap.get().get(relayUrl)
                  )} fill-current  min-w-[20px] mr-1"
                />
                {#snippet popoverContent()}
                  <div class="mr-8">
                    {relayStateMap.get().get(relayUrl)}
                  </div>
                {/snippet}</Popover
              ><span class="inline w-60">{relayUrl}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/snippet}</Popover
>
