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
  import { setRxNostr, setRelays } from "$lib/func/nostr";
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
  import type { DefaultRelayConfig, EventPacket } from "rx-nostr";
  import type { QueryKey } from "@tanstack/svelte-query";

  import { addDebugLog, getStorageData } from "$lib/components/Debug/debug";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

  const STORAGE_KEY = "lumiSetting";
  const lumiEmoji_STORAGE_KEY = STORAGE_KEYS.LUMI_EMOJI;
  const lumiMute_STORAGE_KEY = "lumiMute";
  const lumiMuteByKind_STORAGE_KEY = "lumiMuteByKind";

  let {
    contents,
    loading,
  }: {
    loading: import("svelte").Snippet;
    contents: import("svelte").Snippet<[{ localRelays: DefaultRelayConfig[] }]>;
  } = $props();

  let localRelays: DefaultRelayConfig[] = $state.raw([]);
  let nowLoading = $state(true);

  onMount(() => {
    addDebugLog("Component mounted - starting initialization");

    try {
      initializeRxNostr();
      const followee = localStorage.getItem("onlyFollowee");
      if (followee === "true") $onlyFollowee = true;

      const raw = localStorage.getItem(STORAGE_KEYS.TIMELINE_FILTER);
      let saved: unknown = null;
      if (raw && raw !== "undefined" && raw !== "null") {
        try {
          saved = JSON.parse(raw);
        } catch (e) {
          addDebugLog(`Failed to parse timelineFilter: ${e}`);
        }
      }

      let defaultFilter: TimelineFilter = {
        ...timelineFilterInit,
        global: { ...timelineFilterInit.global },
      };

      if (saved && typeof saved === "object" && saved !== null) {
        const sf = saved as any;

        if (typeof sf.adaptMute === "boolean")
          defaultFilter.adaptMute = sf.adaptMute;
        if (typeof sf.selectCanversation === "number")
          defaultFilter.selectCanversation = sf.selectCanversation;

        if (sf.global && typeof sf.global === "object") {
          if (typeof sf.global.excludeFollowee === "boolean")
            defaultFilter.global.excludeFollowee = sf.global.excludeFollowee;
          if (typeof sf.global.excludeConversation === "boolean")
            defaultFilter.global.excludeConversation =
              sf.global.excludeConversation;
        }
      }

      timelineFilter.set(defaultFilter);
      try {
        localStorage.setItem(
          STORAGE_KEYS.TIMELINE_FILTER,
          JSON.stringify(defaultFilter)
        );
      } catch (e) {
        addDebugLog(`Failed to save timelineFilter: ${e}`);
      }
    } catch (e) {
      addDebugLog(`Unexpected error in onMount: ${e}`);
    }

    const savedSettings: LumiSetting | null = loadSettingsFromLocalStorage();
    addDebugLog(`savedSettings`, savedSettings);
    try {
      loadMutetokanoSettei();
    } catch (error) {
      addDebugLog("Error: Failed to load Mute settings");
    }
    if (savedSettings) applySavedSettings(savedSettings);

    getStorageData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.TIMELINE_FILTER || e.key === STORAGE_KEY) {
        addDebugLog(`Storage changed: ${e.key}`);
        getStorageData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (key === STORAGE_KEYS.TIMELINE_FILTER || key === STORAGE_KEY) {
        addDebugLog(`Storage updated: ${key}`);
        getStorageData();
      }
    };

    nowLoading = false;
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  });
  function initializeRxNostr() {
    if (!$app?.rxNostr) setRxNostr();
    if (!$app?.rxNostr3) setRxNostr3();
  }

  function isValidLumiSetting(obj: unknown): obj is LumiSetting {
    if (typeof obj !== "object" || obj === null) return false;

    const o = obj as any;

    // 必須の文字列プロパティ
    if (typeof o.pubkey !== "string" || typeof o.useRelaySet !== "string") {
      return false;
    }

    // relays配列のチェック
    if (!Array.isArray(o.relays)) return false;

    // booleanプロパティのチェック
    const boolKeys = [
      "showImg",
      "embed",
      "showPreview",
      "menuleft",
      "showRelayIcon",
      "showReactioninTL",
      "showUserStatus",
      "showKind16",
      "showAllReactions",
      "kind42inTL",
      "addClientTag",
    ];
    for (const key of boolKeys) {
      if (typeof o[key] !== "boolean") return false;
    }

    // numberプロパティのチェック
    if (typeof o.picQuarity !== "number") return false;

    // imageAutoExpandのチェック（"all" | "following" | "manual"）
    if (
      typeof o.imageAutoExpand !== "string" ||
      !["all", "following", "manual"].includes(o.imageAutoExpand)
    ) {
      return false;
    }

    // defaultReactionオブジェクトのチェック
    if (
      typeof o.defaultReaction !== "object" ||
      o.defaultReaction === null ||
      typeof o.defaultReaction.content !== "string" ||
      !Array.isArray(o.defaultReaction.tag) ||
      !o.defaultReaction.tag.every((t: unknown) => typeof t === "string")
    ) {
      return false;
    }

    return true;
  }

  function loadSettingsFromLocalStorage(): LumiSetting | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return isValidLumiSetting(parsed) ? parsed : null;
    } catch (error: any) {
      addDebugLog(`Failed to parse localStorage settings  ${error}`);
      return null;
    }
  }

  function applySavedSettings(settings: LumiSetting) {
    lumiSetting.set(settings);
    addDebugLog("Settings applied to lumiSetting store");
    if (!lumiSetting.get().imageAutoExpand) {
      lumiSetting.update((v) => ({ ...v, imageAutoExpand: "all" }));
    }
    if (
      lumiSetting.get().useRelaySet === "1" &&
      lumiSetting.get().relays.length > 0
    ) {
      localRelays = lumiSetting.get().relays;
      setRelays(localRelays as DefaultRelayConfig[]);
    } else {
      localRelays = [];
    }
  }

  function loadMutetokanoSettei() {
    const mute = localStorage.getItem(lumiMute_STORAGE_KEY);
    const emoji = localStorage.getItem(lumiEmoji_STORAGE_KEY);
    const mutebykind = localStorage.getItem(lumiMuteByKind_STORAGE_KEY);
    $mutes = mute ? (JSON.parse(mute) as LumiMute) : initLumiMute;
    $emojis = emoji ? (JSON.parse(emoji) as LumiEmoji) : initLumiEmoji;
    $mutebykinds = mutebykind
      ? (JSON.parse(mutebykind) as LumiMuteByKind)
      : initLumiMuteByKind;
    if ($mutebykinds && !Array.isArray($mutebykinds.list)) {
      try {
        const list = JSON.parse($mutebykinds.list);
        $mutebykinds = { ...$mutebykinds, list: list ?? [] };
        localStorage.setItem(
          lumiMuteByKind_STORAGE_KEY,
          JSON.stringify($mutebykinds)
        );
      } catch (error) {
        addDebugLog(`Error fixing mutebykinds.list: ${error}`);
      }
    }
    try {
      const bookmark = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (bookmark) {
        const parsedData: EventPacket = JSON.parse(bookmark);
        if (parsedData) {
          const queryKey: QueryKey = [
            "naddr",
            `${10003}:${parsedData.event.pubkey}:`,
          ];
          queryClient.setQueryData(queryKey, parsedData);
          bookmark10003.set(parsedData.event);
        }
      }
    } catch (error) {
      addDebugLog(`Error loading bookmark: ${error}`);
    }
  }
</script>

{#if nowLoading}
  {@render loading()}
{:else}
  {@render contents({ localRelays })}
{/if}
