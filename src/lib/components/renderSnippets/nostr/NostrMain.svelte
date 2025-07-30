<script lang="ts">
  import {
    app,
    emojis,
    mutebykinds,
    mutes,
    defaultRelays,
    onlyFollowee,
    queryClient,
  } from "$lib/stores/stores";

  //import { goto } from "$app/navigation";
  import { setRxNostr, setRelays } from "$lib/func/nostr";
  import type { DefaultRelayConfig, EventPacket } from "rx-nostr";
  import { onMount } from "svelte";
  import {
    timelineFilterInit,
    type LumiEmoji,
    type LumiMute,
    type LumiMuteByKind,
    type LumiSetting,
  } from "$lib/types";

  import {
    BOOKMARK_STORAGE_KEY,
    initLumiEmoji,
    initLumiMute,
    initLumiMuteByKind,
  } from "$lib/func/constants";
  import { setRxNostr3 } from "$lib/func/reactions";
  import {
    bookmark10003,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";

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
      [{ /*  pubkey: string;  */ localRelays: DefaultRelayConfig[] }]
    >;
  } = $props();

  let localRelays: DefaultRelayConfig[] = $state.raw([]);

  /*  let pubkey: string = $state("");
  $effect(() => {
    const pub = lumiSetting.get().pubkey;

    if (pub) {
      untrack(() => {
        pubkey = pub;
      });
    }
  }); */
  let nowLoading = $state(true); // ローディング状態を追跡する変数を追加

  onMount(async () => {
    console.log($defaultRelays);

    initializeRxNostr();

    const followee = localStorage.getItem("onlyFollowee"); //通知欄の奴
    if (followee === "true") {
      $onlyFollowee = true;
    }

    // timelineFilterの処理
    try {
      const timeline = localStorage.getItem("timelineFilter");

      // 値の存在と妥当性をチェック
      if (
        !timeline ||
        timeline === "undefined" ||
        timeline === "null" ||
        timeline === "" ||
        timeline.length < 2
      ) {
        throw new Error("Invalid timeline data");
      }

      // JSON.parseを試行
      const timelineData = JSON.parse(timeline);

      // パース結果の基本チェック
      if (
        !timelineData ||
        typeof timelineData !== "object" ||
        Array.isArray(timelineData)
      ) {
        throw new Error("Parsed data is not a valid object");
      }

      // スプレッド演算子でマージ（必要なプロパティのみ明示的に指定）
      const mergedFilter = {
        ...timelineFilterInit,
        // 現行形式のプロパティのみを明示的にマージ
        ...(typeof timelineData.adaptMute === "boolean" && {
          adaptMute: timelineData.adaptMute,
        }),
        ...(typeof timelineData.selectCanversation === "number" &&
          [0, 1, 2].includes(timelineData.selectCanversation) && {
            selectCanversation: timelineData.selectCanversation,
          }),
        global: {
          ...timelineFilterInit.global,
          ...(timelineData.global || {}),
        },
      };

      timelineFilter.set(mergedFilter);
      localStorage.setItem("timelineFilter", JSON.stringify(mergedFilter));
    } catch (error: any) {
      console.warn("timelineFilter reset due to:", error.message);

      // エラー時は確実にクリーンアップ
      try {
        localStorage.removeItem("timelineFilter");
      } catch (e) {
        console.warn("Failed to remove corrupted timelineFilter:", e);
      }

      // デフォルト値で初期化
      const defaultFilter = { ...timelineFilterInit };
      timelineFilter.set(defaultFilter);

      try {
        localStorage.setItem("timelineFilter", JSON.stringify(defaultFilter));
      } catch (e) {
        console.warn("Failed to save default timelineFilter:", e);
      }
    }

    const savedSettings: LumiSetting | null = loadSettingsFromLocalStorage();
    loadMutetokanoSettei();
    if (savedSettings) {
      applySavedSettings(savedSettings);
    } else {
      // 省略...
    }

    nowLoading = false;
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
    if (!lumiSetting.get().imageAutoExpand) {
      lumiSetting.update((value) => {
        return { ...value, imageAutoExpand: "all" };
      });
    }
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
    //bookmark
    const bookmark = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (bookmark) {
      try {
        const parsedData: EventPacket = JSON.parse(bookmark);
        if (parsedData) {
          const queryKey: QueryKey = [
            "naddr",
            `${10003}:${parsedData.event.pubkey}:`,
          ];
          queryClient.setQueryData(queryKey, parsedData);
          bookmark10003.set(parsedData.event);
        }
      } catch (error) {}
    }
  }
</script>

{#if nowLoading}
  {@render loading()}
{:else}
  {@render contents({ localRelays })}
{/if}
