<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import {
    app,
    emojis,
    mutebykinds,
    mutes,
    defaultRelays,
    onlyFollowee,
    loginUser,
  } from "$lib/stores/stores";

  import { goto } from "$app/navigation";
  import { setRxNostr, setRelays } from "$lib/func/nostr";
  import { relaySearchRelays } from "$lib/stores/relays";
  import type { DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";
  import type {
    LumiEmoji,
    LumiMute,
    LumiMuteByKind,
    LumiSetting,
  } from "$lib/types";
  import { page } from "$app/stores";

  import {
    initLumiEmoji,
    initLumiMute,
    initLumiMuteByKind,
  } from "$lib/func/constants";
  import { setRxNostr3 } from "$lib/func/reactions";
  import {
    lumiSetting,
    showBanner,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";

  const STORAGE_KEY = "lumiSetting";
  const lumiEmoji_STORAGE_KEY = "lumiEmoji";
  const lumiMute_STORAGE_KEY = "lumiMute";
  const lumiMuteByKind_STORAGE_KEY = "lumiMuteByKind";

  let {
    contents,
    loading,
  }: {
    loading: import("svelte").Snippet;
    contents: import("svelte").Snippet<
      [{ pubkey: string; localRelays: DefaultRelayConfig[] }]
    >;
  } = $props();

  let localRelays: DefaultRelayConfig[] = $state.raw([]);
  // svelte-ignore non_reactive_update
  let pubkey: string = $state("");

  let nowLoading = $state(true); // ローディング状態を追跡する変数を追加

  onMount(async () => {
    console.log($defaultRelays);
    // console.log(queryClient?.getQueryData(["defaultRelay", $loginUser]));

    initializeRxNostr();

    const followee = localStorage.getItem("onlyFollowee");
    if (followee === "true") {
      $onlyFollowee = true;
    }
    const timeline = localStorage.getItem("timelineFilter");
    if (timeline) {
      try {
        timelineFilter.set(JSON.parse(timeline));
      } catch (error) {
        console.log("timelineFilter parse error");
      }
    }
    //layout.svelteでbannerが表示されたときにやるからここではやんなくていい
    // const banner: boolean = localStorage.getItem("showBanner") == "true";
    // console.log();
    // console.log(banner);
    // showBanner.set(banner);

    //  await migrateSettings();
    const savedSettings: LumiSetting | null = loadSettingsFromLocalStorage();
    loadMutetokanoSettei();
    if (savedSettings) {
      applySavedSettings(savedSettings);
    } else {
      if ($page.url.pathname === "/") {
        //ホームに居るときだけ設定ないときは設定に飛ばす
        goto("/settings");
      } else {
        //設定なし。閲覧モードのときは画像表示してみる
        lumiSetting.update((cur) => {
          return { ...cur, showImg: true };
        });
      }
    }

    nowLoading = false; // 初期化処理が完了したらローディングを終了
    console.log($defaultRelays);
  });

  function initializeRxNostr() {
    if (!$app?.rxNostr) {
      setRxNostr();
    }
    if (!$app?.rxNostr3) {
      setRxNostr3();
    }
  }

  function loadSettingsFromLocalStorage(): LumiSetting | null {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    //console.log(savedSettings);
    return savedSettings ? (JSON.parse(savedSettings) as LumiSetting) : null;
  }

  function applySavedSettings(settings: LumiSetting) {
    lumiSetting.set(settings);
    //  console.log(savedRelays);
    if (
      lumiSetting.get().useRelaySet === "1" &&
      lumiSetting.get().relays.length > 0
    ) {
      localRelays = lumiSetting.get().relays;
      setRelays(localRelays as DefaultRelayConfig[]);
    } else {
      localRelays = [];
      // setRelays(relaySearchRelays);
    }
    pubkey = $loginUser = lumiSetting.get().pubkey;
  }

  function loadMutetokanoSettei() {
    const mute = localStorage.getItem(lumiMute_STORAGE_KEY);
    const emoji = localStorage.getItem(lumiEmoji_STORAGE_KEY);
    const mutebykind = localStorage.getItem(lumiMuteByKind_STORAGE_KEY);
    // console.log(mute);
    $mutes = mute ? (JSON.parse(mute) as LumiMute) : initLumiMute;
    //   console.log($mutes);
    $emojis = emoji ? (JSON.parse(emoji) as LumiEmoji) : initLumiEmoji;
    $mutebykinds = mutebykind
      ? (JSON.parse(mutebykind) as LumiMuteByKind)
      : initLumiMuteByKind;
    if ($mutebykinds && !Array.isArray($mutebykinds.list)) {
      //storageのデータわけたときにパースするの忘れててstringのままはいってるやつをしゅうせいするためだけのやつ
      try {
        const list = JSON.parse($mutebykinds.list);
        //console.log(list);
        $mutebykinds = { ...$mutebykinds, list: list ?? [] };
        localStorage.setItem(
          lumiMuteByKind_STORAGE_KEY,
          JSON.stringify($mutebykinds)
        );
      } catch (error) {
        console.log(error);
      }
    }
  }
</script>

{#if nowLoading}
  {@render loading()}
{:else}
  {@render contents({ pubkey, localRelays })}
  <!-- <slot {pubkey} {localRelays}></slot> -->
{/if}
