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

  // デバッグ用の状態
  let showDebug = $state(false);
  let debugLogs: string[] = $state([]);
  let storageData = $state<Record<string, any>>({});

  // デバッグログを追加する関数
  function addDebugLog(message: string) {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    debugLogs = [`[${timestamp}] ${message}`, ...debugLogs].slice(0, 50); // 最新50件まで保持
    console.log(message);
  }

  // ローカルストレージの内容を取得する関数
  function getStorageData() {
    const keys = [
      "timelineFilter",
      STORAGE_KEY, // lumiSetting
    ];

    const data: Record<string, any> = {};
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value; // JSONパースできない場合は文字列として保存
        }
      } else {
        data[key] = null;
      }
    });

    storageData = data;
    addDebugLog(`Storage data updated: ${Object.keys(data).length} keys`);
  }

  onMount(() => {
    addDebugLog("Component mounted - starting initialization");

    try {
      initializeRxNostr();
      addDebugLog("RxNostr initialized");

      const followee = localStorage.getItem("onlyFollowee");
      addDebugLog(`onlyFollowee from storage: ${followee}`);
      if (followee === "true") {
        $onlyFollowee = true;
        addDebugLog("onlyFollowee set to true");
      }

      const raw = localStorage.getItem("timelineFilter");
      addDebugLog(
        `timelineFilter raw from storage: ${raw ? "exists" : "null"}`
      );
      let saved: unknown = null;

      if (raw && raw !== "undefined" && raw !== "null") {
        try {
          saved = JSON.parse(raw);
          addDebugLog("timelineFilter parsed successfully");
        } catch (e) {
          addDebugLog(`Failed to parse timelineFilter: ${e}`);
          console.warn("Failed to parse timelineFilter:", e);
        }
      }

      let defaultFilter: TimelineFilter = {
        ...timelineFilterInit,
        global: { ...timelineFilterInit.global },
      };

      if (saved && typeof saved === "object" && saved !== null) {
        const sf = saved as any;
        addDebugLog(
          `Processing saved filter, version: ${sf.version || "undefined"}`
        );

        // ▼ version判定とマイグレーション
        if (sf.version === 2) {
          // ✅ 新形式
          addDebugLog("Using new format (version 2)");
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
          addDebugLog("Using old format (version 1 or no version)");
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
      addDebugLog("timelineFilter set successfully");

      try {
        localStorage.setItem("timelineFilter", JSON.stringify(defaultFilter));
        addDebugLog("timelineFilter saved to localStorage");
      } catch (e) {
        addDebugLog(`Failed to save timelineFilter: ${e}`);
        console.warn("Failed to save timelineFilter");
      }
    } catch (e) {
      addDebugLog(`Unexpected error in onMount: ${e}`);
      console.error("Unexpected error in onMount:", e);
    }

    const savedSettings: LumiSetting | null = loadSettingsFromLocalStorage();
    addDebugLog(`Saved settings loaded: ${savedSettings ? "exists" : "null"}`);

    loadMutetokanoSettei();
    addDebugLog("Mute settings loaded");

    if (savedSettings) {
      applySavedSettings(savedSettings);
      addDebugLog("Saved settings applied");
    }

    // 初期化完了時にストレージデータを取得
    getStorageData();

    // ローカルストレージの変更を監視
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "timelineFilter" || e.key === STORAGE_KEY) {
        addDebugLog(`Storage changed: ${e.key}`);
        getStorageData(); // ストレージデータを更新
      }
    };

    // 他のタブでの変更を監視
    window.addEventListener("storage", handleStorageChange);

    // 同一タブでの変更を監視（storageイベントは同一タブでは発火しないため）
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (key === "timelineFilter" || key === STORAGE_KEY) {
        addDebugLog(`Storage updated: ${key}`);
        getStorageData();
      }
    };

    nowLoading = false;
    addDebugLog("Loading completed");
    console.log($defaultRelays);

    // クリーンアップ関数
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      localStorage.setItem = originalSetItem; // 元の関数を復元
    };
  });

  function initializeRxNostr() {
    if (!$app?.rxNostr) {
      setRxNostr();
      addDebugLog("RxNostr instance created");
    }
    if (!$app?.rxNostr3) {
      setRxNostr3();
      addDebugLog("RxNostr3 instance created");
    }
  }

  function loadSettingsFromLocalStorage(): LumiSetting | null {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    addDebugLog(
      `Loading settings from localStorage: ${savedSettings ? "exists" : "null"}`
    );
    //console.log(savedSettings);
    return savedSettings ? (JSON.parse(savedSettings) as LumiSetting) : null;
  }

  function applySavedSettings(settings: LumiSetting) {
    lumiSetting.set(settings);
    addDebugLog("Settings applied to lumiSetting store");

    if (!lumiSetting.get().imageAutoExpand) {
      lumiSetting.update((value) => {
        return { ...value, imageAutoExpand: "all" };
      });
      addDebugLog("imageAutoExpand set to 'all'");
    }

    //  console.log(savedRelays);
    if (
      lumiSetting.get().useRelaySet === "1" &&
      lumiSetting.get().relays.length > 0
    ) {
      localRelays = lumiSetting.get().relays;
      setRelays(localRelays as DefaultRelayConfig[]);
      addDebugLog(`Using custom relays: ${localRelays.length} relays`);
    } else {
      localRelays = [];
      addDebugLog("Using default relays");
      // setRelays(relaySearchRelays);
    }
  }

  function loadMutetokanoSettei() {
    const mute = localStorage.getItem(lumiMute_STORAGE_KEY);
    const emoji = localStorage.getItem(lumiEmoji_STORAGE_KEY);
    const mutebykind = localStorage.getItem(lumiMuteByKind_STORAGE_KEY);

    addDebugLog(`Mute data: ${mute ? "exists" : "null"}`);
    addDebugLog(`Emoji data: ${emoji ? "exists" : "null"}`);
    addDebugLog(`MuteByKind data: ${mutebykind ? "exists" : "null"}`);

    // console.log(mute);
    $mutes = mute ? (JSON.parse(mute) as LumiMute) : initLumiMute;
    //   console.log($mutes);
    $emojis = emoji ? (JSON.parse(emoji) as LumiEmoji) : initLumiEmoji;
    $mutebykinds = mutebykind
      ? (JSON.parse(mutebykind) as LumiMuteByKind)
      : initLumiMuteByKind;

    if ($mutebykinds && !Array.isArray($mutebykinds.list)) {
      //storageのデータわけたときにパースするの忘れててstringのままはいってるやつをしゅうせいするためだけのやつ
      addDebugLog("Fixing mutebykinds.list format");
      try {
        const list = JSON.parse($mutebykinds.list);
        //console.log(list);
        $mutebykinds = { ...$mutebykinds, list: list ?? [] };
        localStorage.setItem(
          lumiMuteByKind_STORAGE_KEY,
          JSON.stringify($mutebykinds)
        );
        addDebugLog("mutebykinds.list fixed and saved");
      } catch (error) {
        addDebugLog(`Error fixing mutebykinds.list: ${error}`);
        console.log(error);
      }
    }

    //bookmark
    const bookmark = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    addDebugLog(`Bookmark data: ${bookmark ? "exists" : "null"}`);

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
          addDebugLog("Bookmark data loaded and set");
        }
      } catch (error) {
        addDebugLog(`Error loading bookmark: ${error}`);
      }
    }
  }

  // デバッグパネルの表示/非表示を切り替え
  function toggleDebug() {
    showDebug = !showDebug;
    if (showDebug) {
      getStorageData(); // デバッグパネルを開く時にストレージデータを更新
    }
  }

  // ストレージをクリアする関数（デバッグ用）
  function clearStorage() {
    if (confirm("本当にすべてのローカルストレージをクリアしますか？")) {
      localStorage.clear();
      addDebugLog("LocalStorage cleared");
      getStorageData();
    }
  }
</script>

<!-- デバッグボタン（固定位置） -->
<div style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
  <button
    onclick={toggleDebug}
    style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;"
  >
    {showDebug ? "Hide Debug" : "Show Debug"}
  </button>
</div>

<!-- デバッグパネル -->
{#if showDebug}
  <div
    style="position: fixed; top: 50px; right: 10px; width: 350px; max-height: 80vh; background: rgba(0,0,0,0.9); color: white; padding: 10px; border-radius: 8px; z-index: 9998; overflow-y: auto; font-family: monospace; font-size: 11px;"
  >
    <div
      style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"
    >
      <h3 style="margin: 0; font-size: 14px;">Debug Panel</h3>
      <div>
        <button
          onclick={getStorageData}
          style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; margin-right: 5px; cursor: pointer;"
        >
          Refresh
        </button>
        <button
          onclick={clearStorage}
          style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;"
        >
          Clear Storage
        </button>
      </div>
    </div>

    <!-- ローカルストレージの内容 -->
    <div style="margin-bottom: 15px;">
      <h4 style="margin: 0 0 5px 0; font-size: 12px; color: #ffc107;">
        LocalStorage Contents:
      </h4>
      <div
        style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; max-height: 200px; overflow-y: auto;"
      >
        {#each Object.entries(storageData) as [key, value]}
          <div
            style="margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;"
          >
            <strong style="color: #17a2b8;">{key}:</strong>
            <pre
              style="margin: 2px 0; white-space: pre-wrap; word-break: break-all; font-size: 10px;">{value ===
              null
                ? "null"
                : JSON.stringify(value, null, 2)}</pre>
          </div>
        {/each}
      </div>
    </div>

    <!-- デバッグログ -->
    <div>
      <h4 style="margin: 0 0 5px 0; font-size: 12px; color: #ffc107;">
        Debug Logs:
      </h4>
      <div
        style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; max-height: 300px; overflow-y: auto;"
      >
        {#each debugLogs as log}
          <div style="margin-bottom: 2px; font-size: 10px; line-height: 1.3;">
            {log}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if nowLoading}
  {@render loading()}
{:else}
  {@render contents({ localRelays })}
{/if}
