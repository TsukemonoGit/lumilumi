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

    const timeline = localStorage.getItem("timelineFilter");
    if (timeline) {
      try {
        const parsed = JSON.parse(timeline);

        // 🛡️ 安全確認：オブジェクトでなければ即初期化
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          throw new Error("timelineFilter is not a plain object");
        }

        // 🛡️ 不正な値パターンも弾く（必要に応じて強化）
        if (
          "excludeFollowee" in parsed &&
          typeof parsed.excludeFollowee === "string"
        ) {
          if (
            parsed.excludeFollowee !== "true" &&
            parsed.excludeFollowee !== "false"
          ) {
            throw new Error("excludeFollowee has invalid string value");
          }
        }

        let migrated = { ...parsed };
        let needsSave = false;

        // excludeFolloweeマイグレーション
        if (
          Object.prototype.hasOwnProperty.call(migrated, "excludeFollowee") &&
          !migrated.global
        ) {
          migrated.global = {
            excludeFollowee: !!migrated.excludeFollowee,
            excludeConversation:
              timelineFilterInit.global.excludeConversation || false,
          };
          try {
            delete migrated.excludeFollowee;
          } catch (e) {
            console.warn("Failed to delete excludeFollowee", e);
          }
          needsSave = true;
        }

        // 各プロパティのデフォルト値設定
        if (migrated.adaptMute === undefined) {
          migrated.adaptMute = timelineFilterInit.adaptMute;
          needsSave = true;
        }

        if (migrated.selectCanversation === undefined) {
          migrated.selectCanversation = timelineFilterInit.selectCanversation;
          needsSave = true;
        }

        // globalオブジェクトの確認と補完
        if (!migrated.global || typeof migrated.global !== "object") {
          migrated.global = { ...timelineFilterInit.global };
          needsSave = true;
        } else {
          // globalオブジェクト内の不足プロパティを補完
          if (migrated.global.excludeFollowee === undefined) {
            migrated.global.excludeFollowee =
              timelineFilterInit.global.excludeFollowee;
            needsSave = true;
          }
          if (migrated.global.excludeConversation === undefined) {
            migrated.global.excludeConversation =
              timelineFilterInit.global.excludeConversation;
            needsSave = true;
          }
        }

        timelineFilter.set(migrated);
        if (needsSave) {
          localStorage.setItem("timelineFilter", JSON.stringify(migrated));
        }
      } catch (error) {
        console.warn("timelineFilter is corrupted, resetting", error);
        localStorage.removeItem("timelineFilter");
        timelineFilter.set({ ...timelineFilterInit });
        localStorage.setItem(
          "timelineFilter",
          JSON.stringify(timelineFilterInit)
        );
      }
    } else {
      // timelineFilterが存在しない場合は初期値を使用
      timelineFilter.set({ ...timelineFilterInit });
      localStorage.setItem(
        "timelineFilter",
        JSON.stringify(timelineFilterInit)
      );
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
