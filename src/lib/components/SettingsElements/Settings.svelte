<script lang="ts">
  import { onMount, untrack } from "svelte";

  import * as Nostr from "nostr-typedef";
  import {
    emojis,
    mutes,
    mutebykinds,
    queryClient,
    nowProgress,
  } from "$lib/stores/stores";
  import * as nip19 from "nostr-tools/nip19";

  import type { LumiSetting } from "$lib/types";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { setRelays, usePromiseReq } from "$lib/func/nostr";
  import { type DefaultRelayConfig, latest } from "rx-nostr";
  import { pipe } from "rxjs";

  import type { EventPacket } from "rx-nostr";
  import Kind30078 from "./Kind30078.svelte";
  import {
    initSettings,
    initLumiMute,
    initLumiEmoji,
    initLumiMuteByKind,
  } from "$lib/func/constants";
  import { npubRegex } from "$lib/func/regex";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import SettingsCard from "./SettingsCard.svelte";
  import RelaySettings from "./RelaySettings.svelte";
  import PostSettings from "./PostSettings.svelte";
  import DataUsage from "./DataUsage.svelte";
  import DisplaySettings from "./DisplaySettings.svelte";
  import DoukiSettings from "./DoukiSettings.svelte";
  import ThemeSettings from "./ThemeSettings.svelte";
  import { saveLocalStorage } from "$lib/func/storage";

  const lumiEmoji_STORAGE_KEY = STORAGE_KEYS.LUMI_EMOJI;
  const lumiMute_STORAGE_KEY = "lumiMute";
  const lumiMuteByKind_STORAGE_KEY = "lumiMuteByKind";
  let settings: LumiSetting = $state({ ...initSettings });

  let inputPubkey: string = $state("");

  onMount(async () => {
    $nowProgress = true;
    const savedSettings = loadSettings();

    if (savedSettings) {
      settings = { ...settings, ...savedSettings };

      if (settings.pubkey) {
        try {
          inputPubkey = nip19.npubEncode(settings.pubkey);
        } catch (error) {}
      }
    } else {
      initializeSettings();
    }

    try {
      const mute = localStorage.getItem(lumiMute_STORAGE_KEY);
      const emoji = localStorage.getItem(lumiEmoji_STORAGE_KEY);
      const mutebykind = localStorage.getItem(lumiMuteByKind_STORAGE_KEY);

      $mutes = mute ? JSON.parse(mute) : initLumiMute;
      $emojis = emoji ? JSON.parse(emoji) : initLumiEmoji;
      $mutebykinds = mutebykind ? JSON.parse(mutebykind) : initLumiMuteByKind;
    } catch (error) {}
    $nowProgress = false;
  });

  function isValidLumiSetting(obj: unknown): obj is LumiSetting {
    if (
      typeof obj !== "object" ||
      obj === null ||
      typeof (obj as any).pubkey !== "string" ||
      typeof (obj as any).useRelaySet !== "string"
    ) {
      return false;
    }

    // useRelaySet が "1" の場合は relays が配列かつ non-empty であることを確認
    if (
      (obj as any).useRelaySet === "1" &&
      (!Array.isArray((obj as any).relays) || (obj as any).relays.length === 0)
    ) {
      return false;
    }

    return true;
  }
  function loadSettings(): LumiSetting | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LUMI_SETTINGS);
      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);
      if (isValidLumiSetting(parsed)) {
        return parsed;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  async function initializeSettings() {
    try {
      const gotPubkey = await (
        window?.nostr as Nostr.Nip07.Nostr
      ).getPublicKey();
      if (gotPubkey) {
        inputPubkey = nip19.npubEncode(gotPubkey);
      }
    } catch (error) {
      console.log(error);
    }
  }

  let saveTimeout: ReturnType<typeof setTimeout> | undefined =
    $state(undefined);

  $effect(() => {
    const snapshot = $state.snapshot(settings);
    // inputPubkeyの監視を削除

    untrack(() => {
      if (saveTimeout !== undefined || $nowProgress) {
        clearTimeout(saveTimeout);
        saveTimeout = undefined;
      }

      if (isRelaySelectionInvalid()) return;

      // isPubkeyValid()の呼び出しを削除
      // または別のeffectに分離

      saveTimeout = setTimeout(() => {
        saveSettings();
        saveTimeout = undefined;
      }, 300);
    });
  });

  // inputPubkey専用のeffectを追加
  $effect(() => {
    inputPubkey;

    untrack(() => {
      isPubkeyValid();
    });
  });

  function saveSettings() {
    if ($nowProgress) return; // 既に実行中なら中断
    $nowProgress = true;

    console.log("save");

    try {
      saveLocalStorage(STORAGE_KEYS.LUMI_SETTINGS, JSON.stringify(settings));

      updateStores(settings);
    } catch (error) {
      console.log(error);
    }

    //  location.reload();
    $nowProgress = false;
  }

  async function resetDefaultRelay(settings: LumiSetting) {
    if (
      settings.useRelaySet === "1" &&
      Array.isArray(settings.relays) &&
      settings.relays.length > 0
    ) {
      setRelays(settings.relays as DefaultRelayConfig[]);
    } else {
      // queryKey: ["naddr",`10002:${lumiSetting.value.pubkey}:`,] のデータがあるか確認
      if (!lumiSetting.value.pubkey) return;
      const data: EventPacket[] | undefined = queryClient.getQueryData([
        "naddr",
        `10002:${lumiSetting.value.pubkey}:`,
      ]);
      //console.log(data);
      if (data && data.length > 0) {
        // データがある場合はイベントの形を整えてセット

        setRelays(data[0].event.tags);
      } else {
        const relays = await usePromiseReq(
          {
            filters: [
              { authors: [lumiSetting.value.pubkey], kinds: [10002], limit: 1 },
            ],
            operator: pipe(latest()),
          },
          undefined,
          undefined,
        );
        console.log(relays);
        if (relays) {
          setRelays(relays[0].event.tags);
        }
      }
    }
  }

  function updateStores(settings: LumiSetting) {
    lumiSetting.value.pubkey = settings.pubkey || "";

    resetDefaultRelay(settings);

    lumiSetting.value = settings;
  }

  function isRelaySelectionInvalid() {
    if (settings.useRelaySet === "1") {
      const currentRelays = settings.relays;
      const hasRead = currentRelays.some((relay) => relay.read);
      const hasWrite = currentRelays.some((relay) => relay.write);
      if (!hasRead || !hasWrite) {
        console.log("リードリレーかライトリレーがない");

        return true;
      }
    }
    return false;
  }

  function isPubkeyValid() {
    if (!npubRegex.test(inputPubkey)) {
      settings.pubkey = "";
      return false;
    }
    try {
      //console.log(inputPubkey);
      settings.pubkey = nip19.decode(inputPubkey).data as string;
    } catch (error) {
      console.log(error);

      settings.pubkey = "";
      return false;
    }
    return true;
  }

  async function handleClickLogin() {
    try {
      const gotPubkey = await (
        window?.nostr as Nostr.Nip07.Nostr
      ).getPublicKey();
      if (gotPubkey) {
        inputPubkey = nip19.npubEncode(gotPubkey);
      }
    } catch (error) {
      console.log(error);
    }
  }
</script>

<form class=" flex flex-col gap-4 p-2">
  <SettingsCard
    title={$_("settings.userPubkey.title")}
    desc={$_("settings.userPubkey.desc", { button: "Use Posting Pubkey" })}
  >
    <input
      type="text"
      id="npub"
      class="h-10 w-full rounded-md px-3 py-2 border border-neutral-500/50"
      placeholder="npub"
      bind:value={inputPubkey}
    /><button
      type="button"
      class="h-10 rounded-full bg-neutral-800 px-3 py-1 font-medium text-neutral-200 float-end mt-4 myButton"
      onclick={handleClickLogin}>Use Posting Pubkey</button
    >
  </SettingsCard>
  <!-- ラジオボタン -->
  <RelaySettings {inputPubkey} bind:settings />
  <PostSettings bind:settings />

  <!--- データ使用に関する設定 --->
  <DataUsage bind:settings />

  <!--- 表示設定 --->
  <DisplaySettings bind:settings />

  <!--- Douki --->
  <DoukiSettings bind:settings />

  <!-- NWC 設定 -->
  <!-- <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">NWC</div>
    <input
      type="text"
      id="relay"
      class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500"
      placeholder="入れてもまだ何もならないインプット欄"
      bind:value={settings.nostrWalletConnect}
    />
  </div> -->
  <!-- Theme 設定 -->
  <ThemeSettings />

  <SettingsCard title={$_("settings.backup.title")}>
    <Kind30078 bind:settings saveLumiSettings={saveSettings} />
  </SettingsCard>
</form>
