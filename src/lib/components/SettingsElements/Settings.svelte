<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { writable } from "svelte/store";
  import { createLabel, createRadioGroup, melt } from "@melt-ui/svelte";
  import * as Nostr from "nostr-typedef";
  import ThemeSwitch from "../Elements/ThemeSwitch/ThemeSwitch.svelte";
  import {
    emojis,
    loginUser,
    mutes,
    mutebykinds,
    showImg,
    showPreview,
    toastSettings,
    menuLeft,
    showRelayIcon,
    defaultReaction,
    showReactioninTL,
    nostrWalletConnect,
    nowProgress,
    showUserStatus,
    showKind16,
    addClientTag,
    showClientTag,
    showAllReactions,
  } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";
  import {
    initLumiEmoji,
    initLumiMute,
    initLumiMuteByKind,
    initSettings,
    npubRegex,
    relayRegex,
    relayRegex2,
  } from "$lib/func/util";
  import type {
    LumiEmoji,
    LumiMute,
    LumiMuteByKind,
    LumiSetting,
  } from "$lib/types";
  import { _ } from "svelte-i18n";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { browser } from "$app/environment";
  import UpdateEmojiList from "./UpdateEmojiList.svelte";
  import UpdateMutebykindList from "./UpdateMutebykindList.svelte";
  import UpdateMuteList from "./UpdateMuteList.svelte";
  import { Save, X, Image, RotateCw } from "lucide-svelte";

  import CustomReaction from "../NostrElements/Note/NoteActionButtuns/CustomReaction.svelte";
  import Link from "../Elements/Link.svelte";
  import Dialog from "../Elements/Dialog.svelte";
  import { migrateSettings } from "$lib/func/settings";

  const STORAGE_KEY = "lumiSetting";
  const lumiEmoji_STORAGE_KEY = "lumiEmoji";
  const lumiMute_STORAGE_KEY = "lumiMute";
  const lumiMuteByKind_STORAGE_KEY = "lumiMuteByKind";
  let settings: LumiSetting = { ...initSettings };

  //以下3つは同期した時点で保存
  // let lumiEmoji: LumiEmoji;
  // let lumiMute: LumiMute;
  // let lumiMuteByKind: LumiMuteByKind;

  const originalSettings = writable<LumiSetting | null>(null);

  const selectedRelayset = writable<string>();
  // ラジオボタン設定
  const {
    elements: {
      root: radioGrouproot,
      item: radioGroupitem,
      hiddenInput: radioGrouphiddenInput,
    },
    helpers: { isChecked: radioGroupisChecked },
  } = createRadioGroup({
    defaultValue: settings.useRelaySet,
    value: selectedRelayset,
  });
  $: if ($selectedRelayset && $selectedRelayset.trim() !== "") {
    console.log($selectedRelayset);
    settings.useRelaySet = $selectedRelayset;
  }
  const optionsArr = ["0", "1"];
  const optionsArrStr = [
    $_("settings.relayMenuText0"),
    $_("settings.relayMenuText1"),
  ];
  //inputurl
  const {
    elements: { root: relayInputroot },
  } = createLabel();

  onMount(async () => {
    await migrateSettings();
    const savedSettings = loadSettings();
    console.log(savedSettings);
    if (savedSettings) {
      settings = { ...settings, ...savedSettings };
      inputPubkey = nip19.npubEncode(settings.pubkey);
    } else {
      initializeSettings();
    }
    settings.defaultReaction = settings.defaultReaction ?? {
      content: "+",
      tag: [],
    };
    $loginUser = settings.pubkey;
    $showImg = settings.showImg;
    $showPreview = settings.showPreview;
    $menuLeft = settings.menuleft;
    $showRelayIcon = settings.showRelayIcon;

    $defaultReaction = settings.defaultReaction;
    $selectedRelayset = settings.useRelaySet;
    $showReactioninTL = settings.showReactioninTL;
    $nostrWalletConnect = settings.nostrWalletConnect;
    $showUserStatus = settings.showUserStatus;

    $showKind16 = settings.showKind16;
    $addClientTag = settings.addClientTag;
    $showClientTag = settings.showClientTag;
    $showAllReactions = settings.showAllReactions;
    const mute = localStorage.getItem(lumiMute_STORAGE_KEY);
    const emoji = localStorage.getItem(lumiEmoji_STORAGE_KEY);
    const mutebykind = localStorage.getItem(lumiMuteByKind_STORAGE_KEY);
    //console.log(mute);
    $mutes = mute ? (JSON.parse(mute) as LumiMute) : initLumiMute;
    //console.log($mutes);
    $emojis = emoji ? (JSON.parse(emoji) as LumiEmoji) : initLumiEmoji;
    $mutebykinds = mutebykind
      ? (JSON.parse(mutebykind) as LumiMuteByKind)
      : initLumiMuteByKind;
    // ///なｎ
    // lumiMute = mute ? (JSON.parse(mute) as LumiMute) : initLumiMute;
    // console.log($mutes);
    // lumiEmoji = emoji ? (JSON.parse(emoji) as LumiEmoji) : initLumiEmoji;
    // lumiMuteByKind = mutebykind
    //   ? (JSON.parse(mutebykind) as LumiMuteByKind)
    //   : initLumiMuteByKind;
    originalSettings.set({ ...settings });
    window?.addEventListener("beforeunload", handleBeforeUnload);
  });

  function loadSettings() {
    let savedSettings = localStorage.getItem(STORAGE_KEY);

    return savedSettings ? JSON.parse(savedSettings) : null;
  }

  async function initializeSettings() {
    //設定がまだないとき
    if (browser) {
      const nostrLogin = await import("nostr-login");
      await nostrLogin.init({});
    }

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
  let relayInput: string = "";
  function addRelay() {
    if (!relayInput) return;
    let input = relayInput.trim();
    if (!input.endsWith("/")) {
      input += "/";
    }
    if (relayRegex2.test(input)) {
      settings.relays = [
        ...settings.relays,
        { url: input, read: true, write: true },
      ];
      relayInput = "";
    }
  }

  function removeRelay(url: string) {
    settings.relays = settings.relays.filter((relay) => relay.url !== url);
  }

  function saveSettings() {
    console.log("save");
    if (isRelaySelectionInvalid()) return;
    if (!isPubkeyValid()) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // localStorage.setItem(lumiMute_STORAGE_KEY, JSON.stringify(lumiMute));
    // localStorage.setItem(
    //   lumiMuteByKind_STORAGE_KEY,
    //   JSON.stringify(lumiMuteByKind)
    // );
    // localStorage.setItem(lumiEmoji_STORAGE_KEY, JSON.stringify(lumiEmoji));
    $nowProgress = true;
    toastSettings.set({
      title: "Success",
      description: $_("settings.refleshPage"),
      color: "bg-green-500",
    });
    // console.log($selectedRelayset);
    // console.log(settings.useRelaySet);
    // console.log($loginUser);
    // console.log($originalSettings?.pubkey);
    // if (
    //   ($originalSettings?.pubkey &&
    //     settings.pubkey !== $originalSettings?.pubkey) ||
    //   settings?.useRelaySet !== $originalSettings?.useRelaySet ||
    //   JSON.stringify($originalSettings?.relays) !==
    //     JSON.stringify(settings.relays)
    // ) {
    //   reloadWithoutWarning();

    // }

    $loginUser = settings.pubkey;
    $selectedRelayset = settings.useRelaySet;
    $showImg = settings.showImg;
    $showPreview = settings.showPreview;
    $menuLeft = settings.menuleft;
    $showRelayIcon = settings.showRelayIcon;

    $defaultReaction = settings.defaultReaction;
    $showReactioninTL = settings.showReactioninTL;
    $nostrWalletConnect = settings.nostrWalletConnect;
    $showUserStatus = settings.showUserStatus;

    $showKind16 = settings.showKind16;
    $addClientTag = settings.addClientTag;
    $showClientTag = settings.showClientTag;
    $showAllReactions = settings.showAllReactions;
    // $mutes = lumiMute;
    // $emojis = lumiEmoji;
    // $mutebykinds = lumiMuteByKind;
    //リレーの設定やり直すためにリロードするリロードしてくださいを出す

    originalSettings.set({ ...settings });
    //  location.reload();
    $nowProgress = false;
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

  let inputPubkey: string;

  function cancelSettings() {
    console.log("cancel");
    const savedSettings = loadSettings();
    settings = { ...initSettings };
    if (savedSettings) {
      settings = savedSettings;
      inputPubkey = nip19.npubEncode(settings.pubkey);
      toastSettings.set({
        title: "Warning",
        description: `${$_("settings.toast.resetData")}`,
        color: "bg-orange-500",
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
    if (!$originalSettings) {
      return true;
    }
    const currentSettings = { ...settings };
    try {
      currentSettings.pubkey = nip19.decode(inputPubkey).data as string;
    } catch (error) {
      return true;
    }
    console.log("currentSettings", currentSettings);
    console.log("$originalSettings", $originalSettings);
    // オリジナル設定のプロパティをループ
    for (const key in $originalSettings) {
      if ($originalSettings.hasOwnProperty(key) && key in currentSettings) {
        if (
          $originalSettings[key as keyof LumiSetting] !==
          currentSettings[key as keyof LumiSetting]
        ) {
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
    location.reload();
  }

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (!shouldReload && settingsChanged()) {
      e.preventDefault();
      e.returnValue = "";
    }
  }

  onDestroy(() => {
    console.log("onDestroy", shouldReload);
    if (browser && !shouldReload) {
      window?.removeEventListener("beforeunload", handleBeforeUnload);
    }
  });

  beforeNavigate((navigation) => {
    console.log("beforeNavigate", navigation.type);
    if (navigation.type !== "form" && settingsChanged() && !shouldReload) {
      if (
        !confirm(
          "You have unsaved changes. Are you sure you want to leave this page?"
        )
      ) {
        navigation.cancel();
      }
    }
    shouldReload = false;
  });

  let emojiTag: string[] | undefined;
  let customString: string | undefined;

  $: if (emojiTag && emojiTag.length > 0) {
    console.log(emojiTag);
    settings.defaultReaction = {
      content: `:${emojiTag[0]}:`,
      tag: ["emoji", ...emojiTag],
    };
  }
  const handleClickOk = () => {
    console.log(customString);
    if (customString) {
      settings.defaultReaction = { content: customString, tag: [] };
    }
  };

  let open: {
    update: (
      updater: import("svelte/store").Updater<boolean>,
      sideEffect?: ((newValue: boolean) => void) | undefined
    ) => void;
    set: (this: void, value: boolean) => void;
    subscribe(
      this: void,
      run: import("svelte/store").Subscriber<boolean>,
      invalidate?: import("svelte/store").Invalidator<boolean> | undefined
    ): import("svelte/store").Unsubscriber;
    get: () => boolean;
    destroy?: (() => void) | undefined;
  };

  let displayimage = writable<string>();
  const onClickglobalImageOpen = () => {
    $displayimage = "./relaysetglobal.webp";
    $open = true;
  };
  const onClickkindImageOpen = () => {
    $displayimage = "./mutebykind.webp";
    $open = true;
  };
</script>

<form class=" flex flex-col gap-3">
  <fieldset class="text-sm break-all">
    <legend>[pubkey]</legend>
    <!-- {nip19.npubEncode($pubkey)} -->

    <div class="ml-2">
      <button
        class="h-10 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        on:click={handleClickLogin}>Get Pubkey</button
      >
      <input
        type="text"
        id="relay"
        class="h-10 w-[240px] rounded-md px-3 py-2 border border-magnum-500"
        placeholder="npub"
        bind:value={inputPubkey}
      />
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
      {#each optionsArr as option}
        <div class="flex items-center gap-3">
          <button
            use:melt={$radioGroupitem(option)}
            class="grid h-6 w-6 place-items-center rounded-full shadow-sm border border-magnum-500"
            id={option}
            aria-labelledby="{option}-label"
          >
            {#if $radioGroupisChecked(option)}
              <div class="h-3 w-3 rounded-full bg-magnum-500" />
            {/if}
          </button>
          <label
            class="font-medium capitalize leading-none cursor-pointer"
            for={option}
            id="{option}-label"
          >
            {optionsArrStr[Number(option)]}
          </label>
        </div>
      {/each}
      <input name="line-height" use:melt={$radioGrouphiddenInput} />
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
              class="hover:opacity-75 active:opacity-50"
              on:click={() => removeRelay(relay.url)}><X /></button
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
              class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
              on:click={addRelay}>Add</button
            >
          </div>
        </div>
      </div>
    {/if}
    {#if $loginUser}
      <a
        class="underline text-magnum-300 break-all ml-4 text-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://nostviewstr.vercel.app/{nip19.npubEncode(
          $loginUser
        )}/10002"
      >
        {$_("settings.nostviewstr.kind10002")}
      </a>
      <div class="text-sm ml-4 flex flex-wrap gap-2">
        <a
          class="underline text-magnum-300 break-all"
          target="_blank"
          rel="noopener noreferrer"
          href="https://nostviewstr.vercel.app/{nip19.npubEncode(
            $loginUser
          )}/30002"
        >
          {$_("settings.nostviewstr.kind30002")}
        </a>
        <div class="flex">
          {$_("settings.globalRelay")}<button
            class="inline-flex mt-auto rounded-md px-2 bg-magnum-300 hover:opacity-75 active:opacity-50 text-magnum-800"
            on:click={onClickglobalImageOpen}><Image /></button
          >
        </div>
      </div>
      <div class="text-magnum-500 mt-2">※{$_("settings.relay")}</div>{/if}
  </fieldset>
  <!--投稿の設定-->
  <!-- <fieldset class="border border-magnum-500 rounded-md p-2">
    <legend class="text-magnum-200 font-bold text-lg">Default Reaction</legend>
    <div class="w-fit grid grid-cols-[auto_1fr] gap-2 items-center">
      <CustomReaction
        note={undefined}
        root={undefined}
        atag={undefined}
        {handleClickOk}
        bind:emoji={emojiTag}
        bind:customReaction={customString}
      />{#if settings.defaultReaction?.tag?.length > 0}
        {#if $showImg}
          <img
            loading="lazy"
            class="h-4 object-contain justify-self-center"
            src={settings.defaultReaction.tag[2]}
            alt={settings.defaultReaction.tag[1]}
            title={settings.defaultReaction.tag[1]}
          />{:else}{settings.defaultReaction.tag[1]}{/if}
      {:else if settings.defaultReaction?.content}
        {settings.defaultReaction.content}
      {/if}
    </div>
  </fieldset> -->
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
              bind:emoji={emojiTag}
              bind:customReaction={customString}
            />{#if settings.defaultReaction?.tag?.length > 0}
              {#if $showImg}
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

      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showClientTag}
        />
        {$_("settings.display.showClientTag")}
      </label>
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
    {#if $loginUser}
      <a
        class="underline text-magnum-300 break-all ml-4 text-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://nostviewstr.vercel.app/{nip19.npubEncode(
          $loginUser
        )}/10000"
      >
        {$_("settings.nostviewstr.kind10000")}
      </a>
    {/if}
    <!--mute by kind-->
    <div class="mt-2">
      <UpdateMutebykindList bind:pubkey={settings.pubkey} />
    </div>
    {#if $loginUser}
      <div class="flex gap-2 items-center">
        <a
          class="underline text-magnum-300 break-all ml-4 text-sm"
          target="_blank"
          rel="noopener noreferrer"
          href="https://nostviewstr.vercel.app/{nip19.npubEncode(
            $loginUser
          )}/30007"
          >{$_("settings.nostviewstr.kind30007")}
        </a><button
          class=" rounded-md px-2 h-full bg-magnum-300 hover:opacity-75 active:opacity-50 text-magnum-800"
          on:click={onClickkindImageOpen}><Image /></button
        >
      </div>
    {/if}

    <!--emoji-->
    <div class="mt-4">
      <UpdateEmojiList bind:pubkey={settings.pubkey} />
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
    {#if $loginUser}
      <a
        class="underline text-magnum-300 break-all ml-4 text-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://nostviewstr.vercel.app/{nip19.npubEncode(
          $loginUser
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
    <ThemeSwitch />
  </fieldset>
</form>

<div class=" fixed md:bottom-5 bottom-16 right-5 z-1">
  <div
    class="opacity-75 hover:opacity-100 bg-neutral-200 border border-magnum-500 rounded-md flex flex-row items-center gap-4 mt-1 justify-center p-2"
  >
    <button
      class=" rounded-fullmd w-10 h-10 flex justify-center items-center font-bold text-magnum-900 hover:text-magnum-600 active:opacity-50"
      on:click={reloadWithoutWarning}><RotateCw /></button
    >

    <button
      class=" rounded-md bg-magnum-600 w-24 h-10 flex justify-center items-center gap-1 font-bold text-magnum-100 hover:bg-magnum-900 active:opacity-50"
      on:click={saveSettings}><Save />SAVE</button
    >
    <button
      class=" rounded-md bg-magnum-200 w-20 h-10 font-medium text-magnum-800 hover:bg-magnum-500 active:opacity-50"
      on:click={cancelSettings}>CANCEL</button
    >
  </div>
</div>

<Dialog bind:open
  ><div slot="main" class="flex w-full justify-center">
    <img loading="lazy" alt="relaySttGlobal" class="" src={$displayimage} />
  </div></Dialog
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
