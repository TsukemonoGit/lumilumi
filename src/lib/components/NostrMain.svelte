<script lang="ts">
  import {
    QueryClient,
    QueryClientProvider,
    type QueryKey,
  } from "@tanstack/svelte-query";
  import { app, queryClient } from "$lib/stores/stores";
  import NostrElements from "./NostrElements.svelte";
  import OpenPostWindow from "./OpenPostWindow.svelte";
  import { goto } from "$app/navigation";
  import { setRxNostr, setRelays } from "$lib/func/nostr";
  import { relaySearchRelays } from "$lib/stores/relays";
  import type { DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";

  const STORAGE_KEY = "relaySettings";
  let localRelays: DefaultRelayConfig[] = [];
  let pubkey: string = "";
  let loading = true; // ローディング状態を追跡する変数を追加

  onMount(() => {
    initializeRxNostr();
    const savedSettings = loadSettingsFromLocalStorage();

    if (savedSettings) {
      applySavedSettings(savedSettings);
    } else {
      goto("/settings");
    }
    loading = false; // 初期化処理が完了したらローディングを終了
  });

  function initializeRxNostr() {
    if (!$app?.rxNostr) {
      setRxNostr();
    }
  }

  function loadSettingsFromLocalStorage() {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    console.log(savedSettings);
    return savedSettings ? JSON.parse(savedSettings) : null;
  }

  function applySavedSettings(settings: {
    relays: DefaultRelayConfig[];
    useRelaySet: string;
    pubkey: string;
  }) {
    const {
      relays: savedRelays,
      useRelaySet: savedRelaySet,
      pubkey: savedPubkey,
    } = settings;
    console.log(savedRelays);
    if (savedRelaySet === "1" && savedRelays.length > 0) {
      localRelays = savedRelays;
      setRelays(localRelays as DefaultRelayConfig[]);
    } else {
      localRelays = [];
      setRelays(relaySearchRelays);
    }
    pubkey = savedPubkey;
  }

  //$: console.log($queryClient.getQueriesData(filter));
</script>

<QueryClientProvider client={$queryClient}>
  {#if loading}
    <slot name="loading" />
  {:else}
    <slot {pubkey} {localRelays}>
      <NostrElements />
    </slot>
  {/if}
</QueryClientProvider>
<div class="fixed right-auto bottom-5 z-10">
  <OpenPostWindow />
</div>
