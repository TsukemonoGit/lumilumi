<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import {
    app,
    emojis,
    loginUser,
    menuLeft,
    mutebykinds,
    mutes,
    showImg,
    showPreview,
    showRelayIcon,
    defaultReaction,
    showReactioninTL,
    defaultRelays,
    queryClient,
    showUserStatus,
    showBanner,
    showKind16,
    onlyFollowee,
    addClientTag,
    showClientTag,
    showAllReactions,
    kind42inTL,
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
  import { migrateSettings } from "$lib/func/settings";
  import {
    initLumiEmoji,
    initLumiMute,
    initLumiMuteByKind,
  } from "$lib/func/constants";
  import { setRxNostr3 } from "$lib/func/reactions";
  import { timelineFilter } from "$lib/stores/globalRunes.svelte";

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
    console.log($queryClient?.getQueryData(["defaultRelay", $loginUser]));
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

    $showBanner = localStorage.getItem("showBanner") === "true";

    await migrateSettings();
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
        $showImg = true;
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
    const {
      relays: savedRelays,
      useRelaySet: savedRelaySet,
      pubkey: savedPubkey,
      showImg: savedShowImg,
      showPreview: savedShowPreview,

      menuleft: savedMenuLeft,
      showRelayIcon: savedShowRelayIcon,
      // mute: savedMute,
      // emoji: savedEmoji,
      // mutebykinds: savedMutebykinds,
      defaultReaction: savedDefaultReaction,
      showReactioninTL: savedReactionTL,
      //  nostrWalletConnect: savedNostrWalletConnect,
      showUserStatus: savedShowUserStatus,

      showKind16: savedShowKind16,
      addClientTag: savedAddClientTag,
      showClientTag: savedShowClientTag,
      showAllReactions: savedShowAllReactions,
      kind42inTL: savedKind42inTL,
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

    $showImg = savedShowImg ? savedShowImg : false;

    $showPreview = savedShowPreview ? savedShowPreview : false;
    $menuLeft = savedMenuLeft ? savedMenuLeft : false;
    $showRelayIcon = savedShowRelayIcon ? savedShowRelayIcon : false;
    $defaultReaction = savedDefaultReaction
      ? savedDefaultReaction
      : { content: "+", tag: [] };
    $showReactioninTL = savedReactionTL ?? true;
    //$nostrWalletConnect = savedNostrWalletConnect ?? "";
    $showUserStatus = savedShowUserStatus ?? false;

    // if (!$showImg) {
    //省エネモードのときはローカルストレージのメタデータ使って、そうじゃないときは新しくメタデータ取ってくる感じ。とおもったけど処理重くなりそうだから使い回しでいいか省エネじゃないときはqueryclientのでーたが古くなる判定のとこ変えたらいい？←まだやってない
    //とりあえずfunctionの方でget(showImg)の値によってよみこむ設定
    // getMetadataFromLocalStorage();
    //}
    $showKind16 = savedShowKind16;
    // $mutes = savedMute ? savedMute.list : undefined;

    // $emojis = savedEmoji && savedEmoji.list ? savedEmoji.list : [];

    // if (savedMutebykinds && savedMutebykinds.list) {
    //   try {
    //     $mutebykinds = savedMutebykinds.list;
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }
    $addClientTag = savedAddClientTag;
    $showClientTag = savedShowClientTag ? savedShowClientTag : true;
    $showAllReactions = savedShowAllReactions;
    $kind42inTL = savedKind42inTL;
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
