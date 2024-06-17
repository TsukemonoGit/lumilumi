<script lang="ts">
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import {
    app,
    emojis,
    loginUser,
    mutebykinds,
    mutes,
    showImg,
  } from "$lib/stores/stores";
  import NostrElements from "./NostrElements.svelte";
  import OpenPostWindow from "./OpenPostWindow.svelte";
  import { goto } from "$app/navigation";
  import { setRxNostr, setRelays, setSavedMetadata } from "$lib/func/nostr";
  import { relaySearchRelays } from "$lib/stores/relays";
  import type { DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";
  import type { LumiSetting } from "$lib/types";

  const STORAGE_KEY = "lumiSetting";

  let localRelays: DefaultRelayConfig[] = [];
  let pubkey: string = "";
  let loading = true; // ローディング状態を追跡する変数を追加

  onMount(() => {
    initializeRxNostr();
    const savedSettings: LumiSetting | null = loadSettingsFromLocalStorage();

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

  function loadSettingsFromLocalStorage(): LumiSetting | null {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    //console.log(savedSettings);
    return savedSettings ? (JSON.parse(savedSettings) as LumiSetting) : null;
  }

  function applySavedSettings(settings: LumiSetting) {
    const {
      relays: savedRelays,
      useRelaySet: savedRelaySet,
      pubkey: savedPubkey,
      showImg: savedShowImg,
      mute: savedMute,
      emoji: savedEmoji,
      mutebykinds: savedMutebykinds,
    } = settings;
    //  console.log(savedRelays);
    if (savedRelaySet === "1" && savedRelays.length > 0) {
      localRelays = savedRelays;
      setRelays(localRelays as DefaultRelayConfig[]);
    } else {
      localRelays = [];
      setRelays(relaySearchRelays);
    }
    pubkey = savedPubkey;
    $loginUser = pubkey;
    if (savedShowImg) {
      $showImg = savedShowImg;
    }
    if (savedMute) {
      $mutes = savedMute.list;
    }
    if (savedEmoji && savedEmoji.list) {
      $emojis = savedEmoji.list;
    }
    if (savedMutebykinds && savedMutebykinds.list) {
      try {
        $mutebykinds = JSON.parse(savedMutebykinds.list);
      } catch (error) {
        console.log(error);
      }
    }
  }

  //$: console.log($queryClient.getQueriesData(filter));
</script>

{#if loading}
  <slot name="loading" />
{:else}
  <slot {pubkey} {localRelays}>
    <NostrElements />
  </slot>
{/if}

<div class="fixed right-auto bottom-5 z-10">
  <OpenPostWindow />
</div>
