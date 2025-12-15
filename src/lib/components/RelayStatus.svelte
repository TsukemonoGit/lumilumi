<script lang="ts">
  import { defaultRelays } from "$lib/stores/stores";
  import { Circle, RadioTower, RefreshCcw } from "lucide-svelte";
  import Popover from "./Elements/Popover.svelte";
  import { reconnectRelay } from "$lib/func/nostr";
  import { cleanRelayUrl, getColor } from "$lib/func/util";
  import RelayStatusColor from "./RelayStatusColor.svelte";
  import { relayStateMap } from "$lib/stores/globalRunes.svelte";
  import type { ConnectionState } from "rx-nostr";
  import { rxNostr3ReccoctRelay } from "$lib/func/reactions";
  import { untrack } from "svelte";

  const ERROR_STATES: ConnectionState[] = ["error", "rejected", "terminated"];
  const RECONNECT_COOLDOWN = 3000;

  let disabledButton: string | undefined = $state();

  let readRelays = $derived(
    $defaultRelays
      ? Object.values($defaultRelays).filter((config) => config.read)
      : []
  );

  let writeRelays = $derived(
    $defaultRelays
      ? Object.values($defaultRelays).filter((config) => config.write)
      : []
  );

  let overallStateColor = $derived.by(() => {
    const allStatus = [...readRelays, ...writeRelays].map((relay) =>
      relayStateMap.get(cleanRelayUrl(relay.url))
    );

    const stateCount: Record<string, number> = {};
    allStatus.forEach((state) => {
      if (state) {
        stateCount[state] = (stateCount[state] || 0) + 1;
      }
    });

    let maxCount = 0;
    let overallState = "initialized";

    for (const [state, count] of Object.entries(stateCount)) {
      if (count > maxCount) {
        maxCount = count;
        overallState = state;
      }
    }

    return getColor(overallState);
  });

  const handleClickReconnect = (url: string) => {
    reconnectRelay(url);
    rxNostr3ReccoctRelay(url);
    disabledButton = url;
    setTimeout(() => {
      disabledButton = undefined;
    }, RECONNECT_COOLDOWN);
  };

  let errorRelayCount = $derived.by(() => {
    // relayStateMapを参照することで変更を検知
    const map = relayStateMap;
    const readRelayUrls = readRelays.map((relay) => cleanRelayUrl(relay.url));

    return [...map.entries()].filter(
      ([url, state]) =>
        readRelayUrls.includes(url) && ERROR_STATES.includes(state)
    ).length;
  });
</script>

<Popover ariaLabel="relays status">
  <div class="flex gap-0.5 items-end">
    <RadioTower
      size="20"
      class="{overallStateColor} hover:opacity-75 active:opacity-50"
    />
    <div class="font-bold text-xs text-red-500">
      {errorRelayCount !== 0 ? errorRelayCount : ""}
    </div>
  </div>

  {#snippet popoverContent()}
    <div class="max-h-80 overflow-x-auto max-w-80">
      <div class="mr-2">
        <div class="text-magnum-200 font-bold text-lg mt-2">read</div>
        <ul>
          {#each readRelays as relay}
            {@const relayUrl = cleanRelayUrl(relay.url)}
            {@const state = relayStateMap.get(relayUrl)}
            <li class="flex align-middle items-center break-all">
              <RelayStatusColor relay={relay.url} />
              <span class="inline w-60">{relayUrl}</span>
              {#if state === "error"}
                <button
                  onclick={() => handleClickReconnect(relayUrl)}
                  class="hover:opacity-75 active:opacity-50 text-magnum-400 disabled:opacity-25 w-[20px] h-[20px] flex justify-center items-center"
                  disabled={relayUrl === disabledButton}
                >
                  <RefreshCcw size={16} strokeWidth={2.5} />
                </button>
              {/if}
            </li>
          {/each}
        </ul>
        <div class="text-magnum-200 font-bold text-lg">write</div>
        <ul>
          {#each writeRelays as relay}
            {@const relayUrl = cleanRelayUrl(relay.url)}
            {@const state = relayStateMap.get(relayUrl)}
            <li class="flex align-middle items-center break-all">
              <Popover ariaLabel="{relay.url} status">
                <Circle
                  size="20"
                  class="{getColor(state)} fill-current min-w-[20px] mr-1"
                />
                {#snippet popoverContent()}
                  <div class="mr-8">{state}</div>
                {/snippet}
              </Popover>
              <span class="inline w-60">{relayUrl}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/snippet}
</Popover>
