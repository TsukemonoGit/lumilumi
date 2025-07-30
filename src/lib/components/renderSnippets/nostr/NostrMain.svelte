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
    type TimelineFilter,
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

  let nowLoading = $state(true); // ローディング状態を追跡する変数を追加

  onMount(() => {
    try {
      initializeRxNostr();

      const followee = localStorage.getItem("onlyFollowee");
      if (followee === "true") {
        $onlyFollowee = true;
      }

      const raw = localStorage.getItem("timelineFilter");
      let saved: unknown = null;

      if (raw && raw !== "undefined" && raw !== "null") {
        try {
          saved = JSON.parse(raw);
        } catch (e) {
          console.warn("Failed to parse timelineFilter:", e);
        }
      }

      let defaultFilter: TimelineFilter = {
        ...timelineFilterInit,
        global: { ...timelineFilterInit.global },
      };

      if (saved && typeof saved === "object" && saved !== null) {
        const sf = saved as any;

        // ▼ version判定とマイグレーション
        if (sf.version === 2) {
          // ✅ 新形式
          if (typeof sf.adaptMute === "boolean") {
            defaultFilter.adaptMute = sf.adaptMute;
          }
          if (typeof sf.selectCanversation === "number") {
            defaultFilter.selectCanversation = sf.selectCanversation;
          }
          if (sf.global && typeof sf.global === "object") {
            if (typeof sf.global.excludeFollowee === "boolean") {
              defaultFilter.global.excludeFollowee = sf.global.excludeFollowee;
            }
            if (typeof sf.global.excludeConversation === "boolean") {
              defaultFilter.global.excludeConversation =
                sf.global.excludeConversation;
            }
          }
        } else {
          // 🧪 旧形式（versionなし or version: 1）
          if (typeof sf.adaptMute === "boolean") {
            defaultFilter.adaptMute = sf.adaptMute;
          }
          if (typeof sf.selectCanversation === "number") {
            defaultFilter.selectCanversation = sf.selectCanversation;
          }
          if (typeof sf.excludeFollowee === "boolean") {
            defaultFilter.global.excludeFollowee = sf.excludeFollowee;
          }
          // excludeConversation は旧形式には存在しないのでそのまま
        }
      }

      timelineFilter.set(defaultFilter);
      try {
        localStorage.setItem("timelineFilter", JSON.stringify(defaultFilter));
      } catch (e) {
        console.warn("Failed to save timelineFilter");
      }
    } catch (e) {
      console.error("Unexpected error in onMount:", e);
    }

    const savedSettings: LumiSetting | null = loadSettingsFromLocalStorage();
    loadMutetokanoSettei();

    if (savedSettings) {
      applySavedSettings(savedSettings);
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
