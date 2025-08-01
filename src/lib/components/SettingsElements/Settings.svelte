<script lang="ts">
  import { onMount } from "svelte";
  import { writable, type Writable } from "svelte/store";
  import { createLabel, createRadioGroup, melt } from "@melt-ui/svelte";
  import * as Nostr from "nostr-typedef";
  import ThemeSwitch from "../Elements/ThemeSwitch/ThemeSwitch.svelte";
  import {
    emojis,
    mutes,
    mutebykinds,
    toastSettings,
    nowProgress,
    queryClient,
  } from "$lib/stores/stores";
  import * as nip19 from "nostr-tools/nip19";

  import type { LumiSetting } from "$lib/types";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { beforeNavigate } from "$app/navigation";
  import UpdateEmojiList from "./UpdateEmojiList.svelte";
  import UpdateMutebykindList from "./UpdateMutebykindList.svelte";
  import UpdateMuteList from "./UpdateMuteList.svelte";
  import { Save, X, Image, RotateCw, ArrowUpRight } from "lucide-svelte";

  import CustomReaction from "../NostrElements/kindEvents/NoteActionButtuns/CustomReaction.svelte";
  import Link from "../Elements/Link.svelte";
  import Dialog from "../Elements/Dialog.svelte";
  import { setRelays, usePromiseReq } from "$lib/func/nostr";
  import { type DefaultRelayConfig, latest } from "rx-nostr";
  import { pipe } from "rxjs";
  import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";
  import type { EventPacket } from "rx-nostr/src";
  import Kind30078 from "./Kind30078.svelte";
  import {
    initSettings,
    initLumiMute,
    initLumiEmoji,
    initLumiMuteByKind,
    LUMI_STORAGE_KEY,
  } from "$lib/func/constants";
  import { relayRegex2, npubRegex } from "$lib/func/regex";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import PicQuarity from "./PicQuarity.svelte";
  import ImageAutoExpand from "./ImageAutoExpand.svelte";
  import { normalizeURL } from "nostr-tools/utils";
  import { addDebugLog, debugError, debugInfo } from "../Debug/debug";
  import ColorThemeSelect from "./ColorThemeSelect.svelte";

  const lumiEmoji_STORAGE_KEY = "lumiEmoji";
  const lumiMute_STORAGE_KEY = "lumiMute";
  const lumiMuteByKind_STORAGE_KEY = "lumiMuteByKind";
  let settings: LumiSetting = $state({ ...initSettings });

  let originalSettings: LumiSetting | undefined = undefined;

  //const optionsArr = ["0", "1"];
  let optionsArrStr = $derived([
    `${$_("settings.relayMenuText0")}`,
    `${$_("settings.relayMenuText1")}`,
  ]);
  //inputurl
  const {
    elements: { root: relayInputroot },
  } = createLabel();

  let beforeRelays: DefaultRelayConfig[];
  let relayInput: string = $state("");
  let inputPubkey: string = $state("");

  const selectedRelayset = writable<string>();
  // ラジオボタン設定
  const {
    elements: {
      root: radioGrouproot,
      item: radioGroupitem,
      hiddenInput: radioGrouphiddenInput,
    },
    states: { value: relaySetValue },
    helpers: { isChecked: radioGroupisChecked },
  } = createRadioGroup({
    // svelte-ignore state_referenced_locally
    defaultValue: settings.useRelaySet,
  });

  relaySetValue.subscribe((value) => {
    if (value) {
      settings.useRelaySet = value;
    }
  });

  onMount(async () => {
    addDebugLog("Component mounted - starting initialization");

    const savedSettings = loadSettings();
    addDebugLog("Loaded settings from localStorage", savedSettings);

    if (savedSettings) {
      settings = { ...settings, ...savedSettings };
      addDebugLog("Merged saved settings into current state");
      try {
        inputPubkey = nip19.npubEncode(settings.pubkey);
        addDebugLog("Encoded pubkey to npub", inputPubkey);
      } catch (error) {
        addDebugLog("Failed to encode pubkey", error);
      }
    } else {
      addDebugLog(
        "No valid saved settings found - calling initializeSettings()"
      );
      initializeSettings();
    }

    try {
      const mute = localStorage.getItem(lumiMute_STORAGE_KEY);
      const emoji = localStorage.getItem(lumiEmoji_STORAGE_KEY);
      const mutebykind = localStorage.getItem(lumiMuteByKind_STORAGE_KEY);

      $mutes = mute ? JSON.parse(mute) : initLumiMute;
      $emojis = emoji ? JSON.parse(emoji) : initLumiEmoji;
      $mutebykinds = mutebykind ? JSON.parse(mutebykind) : initLumiMuteByKind;

      addDebugLog("Loaded mutes/emojis/mutebykind from localStorage");
    } catch (error) {
      addDebugLog("Error while loading mute/emoji/mutebykind", error);
    }

    originalSettings = $state.snapshot(settings);
    addDebugLog("Captured originalSettings snapshot", originalSettings);
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
      const saved = localStorage.getItem(LUMI_STORAGE_KEY);
      if (!saved) {
        addDebugLog("No lumiSetting found in localStorage");
        return null;
      }

      const parsed = JSON.parse(saved);
      if (isValidLumiSetting(parsed)) {
        addDebugLog("Parsed valid lumiSetting from localStorage", parsed);
        $relaySetValue = parsed.useRelaySet;
        return parsed;
      } else {
        addDebugLog("Invalid lumiSetting structure", parsed);
        return null;
      }
    } catch (e) {
      addDebugLog("Error loading lumiSetting", e);
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

  function addRelay() {
    if (!relayInput) return;
    try {
      let input = normalizeURL(relayInput.trim());

      if (relayRegex2.test(input)) {
        settings.relays = [
          ...settings.relays,
          { url: input, read: true, write: true },
        ];
        relayInput = "";
      }
    } catch (error) {
      toastSettings.set({
        title: "Error",
        description: `Invalid URL`,
        color: "bg-red-500",
      });
    }
  }

  function removeRelay(url: string) {
    settings.relays = settings.relays.filter((relay) => relay.url !== url);
  }

  function saveSettings(event?: Event) {
    event?.preventDefault();
    console.log("save");
    if (isRelaySelectionInvalid()) return;
    if (!isPubkeyValid()) return; //settings.pubkeyここで更新される
    $relaySetValue = settings.useRelaySet ?? "0"; //ラジオボタンの状態更新
    try {
      localStorage.setItem(LUMI_STORAGE_KEY, JSON.stringify(settings));

      $nowProgress = true;
      toastSettings.set({
        title: "Success",
        description: `${$_("settings.refreshPage")}`,
        color: "bg-green-500",
      });

      updateStores(settings);

      originalSettings = $state.snapshot(settings);
    } catch (error) {
      toastSettings.set({
        title: "Error",
        description: `Failed to save`,
        color: "bg-red-500",
      });
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
      // queryKey: ["defaultRelay", lumiSetting.get().pubkey] のデータがあるか確認

      const data: EventPacket[] | undefined = queryClient.getQueryData([
        "defaultRelay",
        lumiSetting.get().pubkey,
      ]);
      console.log(data);
      if (data && data.length > 0) {
        // データがある場合はイベントの形を整えてセット
        const relays = setRelaysByKind10002(data[0].event);
        setRelays(relays);
      } else {
        const relays = await usePromiseReq(
          {
            filters: [
              { authors: [lumiSetting.get().pubkey], kinds: [10002], limit: 1 },
            ],
            operator: pipe(latest()),
          },
          undefined,
          undefined
        );
        console.log(relays);
        if (relays) {
          setRelays(setRelaysByKind10002(relays[0].event));
        }
      }
      //else {
      // データがない場合は useRelaySet を呼び出してデフォルトのリレーを設定//これなくてもちゃんと動いてそう（？？）
      //コンポーネント外やでerrorがでる
      // useRelaySet(
      //   ["defaultRelay", lumiSetting.get().pubkey],
      //   [
      //     { authors: [lumiSetting.get().pubkey], kinds: [10002], limit: 1 },
      //   ] as Nostr.Filter[],
      //   undefined
      // );
      //}
    }
  }

  function updateStores(settings: LumiSetting) {
    lumiSetting.get().pubkey = settings.pubkey || "";

    //relayset情報を更新する前に確認
    console.log($selectedRelayset, settings.useRelaySet);
    if (
      $selectedRelayset !== settings.useRelaySet ||
      (settings.useRelaySet === "1" &&
        JSON.stringify(beforeRelays) !== JSON.stringify(settings.relays))
    ) {
      resetDefaultRelay(settings);
    }
    beforeRelays = settings.relays;
    $selectedRelayset = settings.useRelaySet;
    lumiSetting.set(settings);
  }

  function isRelaySelectionInvalid() {
    if (settings.useRelaySet === "1") {
      const currentRelays = settings.relays;
      const hasRead = currentRelays.some((relay) => relay.read);
      const hasWrite = currentRelays.some((relay) => relay.write);
      if (!hasRead || !hasWrite) {
        toastSettings.set({
          title: "Error",
          description: `${$_("settings.toast.relayError")}`,
          color: "bg-red-500",
        });
        return true;
      }
    }
    return false;
  }

  function isPubkeyValid() {
    if (!npubRegex.test(inputPubkey)) {
      toastSettings.set({
        title: "Error",
        description: `${$_("settings.toast.pubkeyError")}`,
        color: "bg-red-500",
      });
      return false;
    }
    try {
      console.log(inputPubkey);
      settings.pubkey = nip19.decode(inputPubkey).data as string;
    } catch (error) {
      console.log(error);
      toastSettings.set({
        title: "Error",
        description: "failed to save pubkey",
        color: "bg-red-500",
      });
      return false;
    }
    return true;
  }

  function cancelSettings() {
    console.log("cancel");
    const savedSettings = loadSettings();

    settings = { ...initSettings };

    originalSettings = $state.snapshot(settings);

    $relaySetValue = settings.useRelaySet; //ラジオボタンの状態更新
    if (savedSettings) {
      settings = savedSettings;
      inputPubkey = nip19.npubEncode(settings.pubkey);
      toastSettings.set({
        title: "Success",
        description: `${$_("settings.toast.resetData")}`,
        color: "bg-green-500",
      });
    }
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

  //変更があったらtrue
  function settingsChanged(): boolean {
    const changedFields: string[] = [];
    if (!originalSettings) {
      //公開鍵が設定されてないとロードするデータが探せないからね
      return true;
    }
    let currentSettings = $state.snapshot(settings);
    try {
      currentSettings = {
        ...currentSettings,
        pubkey: nip19.decode(inputPubkey).data as string,
      };
    } catch (error) {
      return true;
    }
    console.log("currentSettings", currentSettings);
    console.log("$originalSettings", originalSettings);
    // オリジナル設定のプロパティをループ
    for (const key in originalSettings) {
      if (originalSettings.hasOwnProperty(key) && key in currentSettings) {
        if (
          originalSettings[key as keyof LumiSetting]?.toString() !==
          currentSettings[key as keyof LumiSetting]?.toString()
        ) {
          // console.log(originalSettings[key as keyof LumiSetting]);
          // console.log(currentSettings[key as keyof LumiSetting]);
          changedFields.push(key as keyof LumiSetting);
        }
      } else {
        return true;
      }
    }

    if (changedFields.length > 0) {
      console.log("Changed fields:", changedFields);
      return true;
    }

    return false;
  }

  let shouldReload = false;
  // リロード前にフラグを設定してイベントリスナーを無効にする関数
  function reloadWithoutWarning() {
    shouldReload = true;

    try {
      debugInfo("リロード実行", { shouldReload });
      location.reload();
    } catch (e) {
      if (e instanceof DOMException && e.name === "SecurityError") {
        debugError("リロード失敗: セキュリティエラー", e);
      } else {
        debugError("リロード失敗: その他のエラー", e);
        // throw e; // 不明な例外は再スロー（必要に応じて）
      }
    }
  }

  // function handleBeforeUnload(e: BeforeUnloadEvent) {
  //   if (!shouldReload && settingsChanged()) {
  //     e.preventDefault();
  //     e.returnValue = "";
  //   }
  // }

  // onDestroy(() => {
  //   console.log("onDestroy", shouldReload);
  //   if (browser && !shouldReload) {
  //     window?.removeEventListener("beforeunload", handleBeforeUnload);
  //   }
  // });

  beforeNavigate((navigation) => {
    console.log("beforeNavigate", navigation.type);

    if (navigation.from?.url.href === navigation.to?.url.href) {
      navigation.cancel();
      return;
    }
    // ダイアログ関連のナビゲーションを識別するための条件
    const isDialog =
      (navigation.to?.url as any).state?.dialogOpen !== undefined;
    // ダイアログ操作ではなく、フォーム送信でもなく、変更がある場合のみ確認
    if (isDialog && settingsChanged()) {
      if (
        !confirm(
          "You have unsaved changes. Are you sure you want to leave this page?"
        )
      ) {
        navigation.cancel();
      }
    }
  });

  const emojiTag: Writable<string[]> = writable([]);
  let customString: string = $state("");

  emojiTag.subscribe((value) => {
    if (value && value.length > 0) {
      console.log(value);
      settings.defaultReaction = {
        content: `:${value[0]}:`,
        tag: ["emoji", ...value],
      };
    }
  });
  const handleClickOk = () => {
    console.log(customString);
    if (customString) {
      settings.defaultReaction = { content: customString, tag: [] };
    }
  };

  // svelte-ignore non_reactive_update
  let open: Writable<boolean> = writable(false);
</script>

<form class=" flex flex-col gap-3">
  <fieldset class="text-sm break-all">
    <div class="ml-2">
      <button
        type="button"
        class="h-10 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        onclick={handleClickLogin}>Get Pubkey</button
      >
      <input
        type="text"
        id="npub"
        class="h-10 w-[240px] rounded-md px-3 py-2 border border-magnum-500"
        placeholder="npub"
        bind:value={inputPubkey}
      /> ( User to retrieve what to display )
    </div>
  </fieldset>
  <!-- ラジオボタン -->
  <fieldset class="border border-magnum-500 rounded-md p-2">
    <legend class="text-magnum-200 font-bold text-lg">Relay</legend>
    <div
      use:melt={$radioGrouproot}
      class="flex flex-col gap-3 data-[orientation=horizontal]:flex-row"
      aria-label="View density"
    >
      {#each optionsArrStr as option, index}
        <div class="flex items-center gap-3 w-fix">
          <button
            type="button"
            use:melt={$radioGroupitem(index.toString())}
            class="grid h-6 w-6 place-items-center rounded-full shadow-sm border border-magnum-500"
            id={index.toString()}
            aria-labelledby="{index.toString()}-label"
          >
            {#if $radioGroupisChecked(index.toString())}
              <div class="h-3 w-3 rounded-full bg-magnum-500"></div>
            {/if}
          </button>
          <label
            class="font-medium capitalize leading-none cursor-pointer"
            for={index.toString()}
            id="{index.toString()}-label"
          >
            {option}{#if index === 0 && lumiSetting.get().pubkey}
              <a
                class="underline text-magnum-300 break-all flex-wrap inline-flex"
                href={`/${inputPubkey}/relays`}
                >{$_("settings.kind10002")}<ArrowUpRight size={18} /></a
              >
            {/if}
          </label>
        </div>
      {/each}
      <input use:melt={$radioGrouphiddenInput} />
    </div>

    <!-- リレー設定 -->

    {#if settings.useRelaySet === "1"}
      <div class="w-fit ml-8">
        {#each settings.relays as relay, index}
          <hr />
          <div class="flex gap-4 my-1">
            <div>{relay.url}</div>
            <label>
              <input type="checkbox" bind:checked={relay.read} />
              read
            </label>
            <label>
              <input type="checkbox" bind:checked={relay.write} />
              write
            </label>
            <button
              type="button"
              class="hover:opacity-75 active:opacity-50"
              onclick={() => removeRelay(relay.url)}><X /></button
            >
          </div>
          <hr />
        {/each}

        <div class="flex flex-col items-start justify-center my-2">
          <div class="flex flex-row items-start justify-center">
            <input
              type="text"
              id="relay"
              class="h-10 w-[240px] rounded-md px-3 py-2 border border-magnum-500"
              placeholder="wss://"
              bind:value={relayInput}
            />

            <button
              type="button"
              class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
              onclick={addRelay}>Add</button
            >
          </div>
        </div>
      </div>
    {/if}
  </fieldset>

  <fieldset class="border border-magnum-500 rounded-md p-2">
    <legend class="text-magnum-200 font-bold text-lg">Post</legend>
    <ul>
      <li>
        <div class="flex gap-2">
          <div>{$_("settings.post.defaultReaction")} :</div>
          <div class="w-fit grid grid-cols-[auto_1fr] gap-2 items-center">
            <CustomReaction
              publishAndSetQuery={() => {}}
              note={undefined}
              root={undefined}
              atag={undefined}
              {handleClickOk}
              bind:emoji={$emojiTag}
              bind:customReaction={customString}
            />{#if settings.defaultReaction?.tag?.length > 0}
              {#if lumiSetting.get().showImg}
                <img
                  loading="lazy"
                  class="h-6 object-contain justify-self-center"
                  src={settings.defaultReaction.tag[2]}
                  alt={settings.defaultReaction.tag[1]}
                  title={settings.defaultReaction.tag[1]}
                />{:else}{settings.defaultReaction.tag[1]}{/if}
            {:else if settings.defaultReaction?.content}
              {settings.defaultReaction.content}
            {/if}
          </div>
        </div>
      </li>
      <li>
        <label>
          <input
            type="checkbox"
            class="rounded-checkbox"
            bind:checked={settings.addClientTag}
          />
          {$_("settings.post.addClientTag")}
        </label>
      </li>
      <li>
        {$_("settings.post.picQuarity")}
        {settings.picQuarity}%
        <PicQuarity bind:value={settings.picQuarity} />
      </li>
    </ul>
  </fieldset>

  <!--- データ使用に関する設定 --->
  <fieldset class="border border-magnum-500 rounded-md p-2">
    <legend class="text-magnum-200 font-bold text-lg"
      >{$_("settings.usage.title")}</legend
    >
    <div class="flex flex-col gap-2">
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showImg}
        />
        {$_("settings.display.loadImage")}
      </label>
      {#if settings.showImg}
        <label class={`ml-8`}>
          <input
            type="checkbox"
            class="rounded-checkbox"
            bind:checked={settings.embed}
          />
          {$_("settings.display.embed")}(youtube, twitter,bluesky)
        </label>
        <ImageAutoExpand bind:imageAutoExpand={settings.imageAutoExpand} />
      {/if}
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showAllReactions}
        />
        {$_("settings.display.showAllReaction")}
      </label>
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.kind42inTL}
        />
        {$_("settings.display.kind42inTL")}
      </label>
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showUserStatus}
        />
        {$_("settings.display.showUserStatus")}
      </label>
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showReactioninTL}
        />
        {$_("settings.display.showReactioninTL")}
      </label>

      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showKind16}
        />
        {$_("settings.display.showKind16")}
      </label>
    </div>
  </fieldset>

  <!--- 表示設定 --->
  <fieldset class="border border-magnum-500 rounded-md p-2">
    <legend class="text-magnum-200 font-bold text-lg">Display</legend>
    <div class="flex flex-col gap-2">
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showPreview}
        />
        {$_("settings.display.preview")}
      </label>
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.menuleft}
        />
        {$_("settings.display.menu")}
      </label>
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showRelayIcon}
        />
        {$_("settings.display.showRelayIcon")}
      </label>
      <!-- 常にTLにクライアントタグ表示しておいて良くない❔️-->
      <!--
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showClientTag}
        />
        {$_("settings.display.showClientTag")}
      </label> -->
    </div>
  </fieldset>

  <!--- Douki --->
  <fieldset class="border border-magnum-500 rounded-md p-2">
    <legend class=" text-magnum-200 font-bold text-lg">
      {$_("settings.douki.title")}
    </legend>
    <!--mute-->
    <div class="mt-2">
      <UpdateMuteList bind:pubkey={settings.pubkey} />
    </div>
    {#if lumiSetting.get().pubkey}
      <a
        class="underline text-magnum-300 break-all ml-4 text-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://nostviewstr.vercel.app/{nip19.npubEncode(
          lumiSetting.get().pubkey
        )}/10000"
      >
        {$_("settings.nostviewstr.kind10000")}
      </a>
    {/if}
    <!--mute by kind-->
    <div class="mt-2">
      <UpdateMutebykindList bind:pubkey={settings.pubkey} />
    </div>
    {#if lumiSetting.get().pubkey}
      <div class="flex gap-2 items-center">
        <a
          class="underline text-magnum-300 break-all ml-4 text-sm"
          target="_blank"
          rel="noopener noreferrer"
          href="https://nostviewstr.vercel.app/{nip19.npubEncode(
            lumiSetting.get().pubkey
          )}/30007"
          >{$_("settings.nostviewstr.kind30007")}
        </a><button
          type="button"
          class=" rounded-md px-2 h-full bg-magnum-300 hover:opacity-75 active:opacity-50 text-magnum-800"
          onclick={() => {
            $open = true;
          }}><Image /></button
        >
      </div>
    {/if}
    <!--emoji-->
    <div class="mt-4">
      <UpdateEmojiList />
    </div>
    <div
      class="border rounded-md border-magnum-400 p-1 m-2 before:content-['*']"
    >
      {$_("settings.emoji.notes")}
      <Link
        className="underline text-magnum-300"
        href={"https://github.com/nostr-protocol/nips/blob/master/30.md"}
        >(NIP-30)</Link
      >
    </div>
    {#if lumiSetting.get().pubkey}
      <a
        class="underline text-magnum-300 break-all ml-4 text-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://nostviewstr.vercel.app/{nip19.npubEncode(
          lumiSetting.get().pubkey
        )}/10030"
        >{$_("settings.nostviewstr.kind10030")}
      </a>
    {/if}
  </fieldset>
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
  <fieldset class="border border-magnum-500 rounded-md p-2">
    <legend class="text-magnum-200 font-bold text-lg">theme</legend>
    <div class="flex gap-2 flex-row">
      <ThemeSwitch />
      <ColorThemeSelect />
    </div>
  </fieldset>

  <Kind30078 {settingsChanged} bind:settings saveLumiSettings={saveSettings} />

  <div
    class="sticky bottom-14 md:bottom-2 bg-neutral-200/80 border border-magnum-500 rounded-md flex flex-row items-center gap-4 mt-1 justify-center p-2 w-fit ml-auto"
  >
    <button
      type="button"
      class=" rounded-fullmd w-10 h-10 flex justify-center items-center font-bold text-magnum-900 hover:text-magnum-600 active:opacity-50"
      onclick={reloadWithoutWarning}><RotateCw /></button
    >

    <button
      type="submit"
      class=" rounded-md bg-magnum-600 w-24 h-10 flex justify-center items-center gap-1 font-bold text-magnum-100 hover:bg-magnum-900 active:opacity-50"
      onclick={saveSettings}><Save />SAVE</button
    >
    <button
      type="button"
      class=" rounded-md bg-magnum-200 w-20 h-10 font-medium text-magnum-800 hover:bg-magnum-500 active:opacity-50"
      onclick={cancelSettings}>CANCEL</button
    >
  </div>
</form>

<Dialog bind:open id={"mutebykind_image"}
  >{#snippet main()}
    <div class="flex w-full justify-center">
      <img
        loading="lazy"
        alt="relaySttGlobal"
        class=""
        src="./mutebykind.webp"
      />
    </div>
  {/snippet}</Dialog
>

<style>
  ul {
    list-style-type: disc;
    padding-left: 1.5em;

    line-height: 1.8em;
  }
  ul li::marker {
    color: rgb(var(--color-magnum-400));
  }
</style>
