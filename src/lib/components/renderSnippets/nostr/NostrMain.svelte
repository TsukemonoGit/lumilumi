<script lang="ts">
  import {
    app,
    emojis,
    mutebykinds,
    mutes,
    queryClient,
  } from "$lib/stores/stores";
  import { setRxNostr, setRelays } from "$lib/func/nostr";
  import { onMount, type Snippet } from "svelte";
  import {
    timelineFilterInit,
    type LumiEmoji,
    type LumiMute,
    type LumiMuteByKind,
    type LumiSetting,
    type TimelineFilter,
  } from "$lib/types";
  import {
    initLumiEmoji,
    initLumiMute,
    initLumiMuteByKind,
  } from "$lib/func/constants";

  import {
    bookmark10003,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import type { DefaultRelayConfig, EventPacket } from "rx-nostr";
  import type { QueryKey } from "@tanstack/svelte-query";

  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { migrateNotifiSettings } from "../../../../routes/notifications/notifiSettingsRepository";
  import { setRxNostr3 } from "$lib/func/reactions";

  let {
    contents,
    loading,
  }: {
    loading?: Snippet;
    contents: Snippet<[{ localRelays: DefaultRelayConfig[] }]>;
  } = $props();

  let localRelays: DefaultRelayConfig[] = $state.raw([]);
  let nowLoading = $state(true);

  onMount(() => {
    try {
      initializeRxNostr();
      // Load migrated settings

      migrateNotifiSettings();

      const raw = localStorage.getItem(STORAGE_KEYS.TIMELINE_FILTER);
      let saved: unknown = null;
      if (raw && raw !== "undefined" && raw !== "null") {
        try {
          saved = JSON.parse(raw);
        } catch (e) {
          console.log(e);
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

      Object.assign(timelineFilter, defaultFilter);
      try {
        localStorage.setItem(
          STORAGE_KEYS.TIMELINE_FILTER,
          JSON.stringify(defaultFilter)
        );
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.log(e);
    }

    const savedSettings: LumiSetting | null = loadSettingsFromLocalStorage();

    try {
      loadMutetokanoSettei();
    } catch (error) {
      console.log(error);
    }
    if (savedSettings) applySavedSettings(savedSettings);

    nowLoading = false;
  });
  function initializeRxNostr() {
    if (!$app?.rxNostr) setRxNostr();
    if (!$app?.rxNostr3) setRxNostr3();
  }

  function isValidLumiSetting(obj: unknown): obj is LumiSetting {
    if (typeof obj !== "object" || obj === null) {
      console.log("obj is not object or is null:", obj);
      return false;
    }

    const o = obj as any;

    // 必須の文字列プロパティ
    if (typeof o.pubkey !== "string") {
      console.log("pubkey is invalid:", o.pubkey);
      return false;
    }
    if (typeof o.useRelaySet !== "string") {
      console.log("useRelaySet is invalid:", o.useRelaySet);
      return false;
    }

    // relays配列のチェック
    if (!Array.isArray(o.relays)) {
      console.log("relays is not array:", o.relays);
      return false;
    }

    // booleanプロパティのチェック
    const boolKeys = [
      "showImg",
      // "embed",後で追加しやつだからこのプロパティがない状態で保存されていることもある 昔保存したデータをずっと使ってる人にはこのプロパティが存在しない。
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
      if (typeof o[key] !== "boolean") {
        console.log(`boolean property ${key} is invalid:`, o[key]);
        return false;
      }
    }

    // numberプロパティのチェック ,後で追加しやつだからこのプロパティがない状態で保存されていることもある
    /*   if (typeof o.picQuarity !== "number") {
      console.log("picQuarity is invalid:", o.picQuarity);
      return false;
    } */

    // imageAutoExpandのチェック 後で追加しやつだからこのプロパティがない状態で保存されていることもある
    /*  if (
      typeof o.imageAutoExpand !== "string" ||
      !["all", "following", "manual"].includes(o.imageAutoExpand)
    ) {
      console.log("imageAutoExpand is invalid:", o.imageAutoExpand);
      return false;
    } */

    // defaultReactionオブジェクトのチェック
    if (typeof o.defaultReaction !== "object" || o.defaultReaction === null) {
      console.log("defaultReaction is invalid:", o.defaultReaction);
      return false;
    }
    if (typeof o.defaultReaction.content !== "string") {
      console.log(
        "defaultReaction.content is invalid:",
        o.defaultReaction.content
      );
      return false;
    }
    if (!Array.isArray(o.defaultReaction.tag)) {
      console.log("defaultReaction.tag is not array:", o.defaultReaction.tag);
      return false;
    }
    if (!o.defaultReaction.tag.every((t: unknown) => typeof t === "string")) {
      console.log(
        "defaultReaction.tag contains non-string:",
        o.defaultReaction.tag
      );
      return false;
    }

    return true;
  }

  function loadSettingsFromLocalStorage(): LumiSetting | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LUMI_SETTINGS);
      if (!saved) return null;
      const parsed = JSON.parse(saved);

      return isValidLumiSetting(parsed) ? parsed : null;
    } catch (error: any) {
      console.log(error);
      return null;
    }
  }

  function applySavedSettings(settings: LumiSetting) {
    lumiSetting.set(settings);

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
    const mute = localStorage.getItem(STORAGE_KEYS.LUMI_MUTE);
    const emoji = localStorage.getItem(STORAGE_KEYS.LUMI_EMOJI);
    const mutebykind = localStorage.getItem(STORAGE_KEYS.LUMI_MUTE_BY_KIND);
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
          STORAGE_KEYS.LUMI_MUTE_BY_KIND,
          JSON.stringify($mutebykinds)
        );
      } catch (error) {
        console.log(error);
      }
    }
    try {
      const bookmark = localStorage.getItem(STORAGE_KEYS.BOOKMARK);
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
      console.log(error);
    }
  }
</script>

{#if nowLoading}
  {@render loading?.()}
{:else}
  {@render contents({ localRelays })}
{/if}
