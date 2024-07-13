<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { writable, type Writable } from "svelte/store";
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
  } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";
  import { initSettings, npubRegex, relayRegex } from "$lib/func/util";
  import type { LumiSetting, MuteList } from "$lib/types";
  import { _ } from "svelte-i18n";
  import { beforeNavigate } from "$app/navigation";
  import { browser } from "$app/environment";
  import UpdateEmojiList from "./UpdateEmojiList.svelte";
  import UpdateMutebykindList from "./UpdateMutebykindList.svelte";
  import UpdateMuteList from "./UpdateMuteList.svelte";
  import type { DefaultRelayConfig } from "rx-nostr";
  import { Save } from "lucide-svelte";
  import CustomReaction from "../NostrElements/Note/NoteActionButtuns/CustomReaction.svelte";
  let ischange = false;
  const STORAGE_KEY = "lumiSetting";
  let settings: LumiSetting = { ...initSettings };
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
    const savedSettings = loadSettings();
    console.log(savedSettings);
    if (savedSettings) {
      settings = savedSettings;
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
    $mutes = settings.mute?.list ?? undefined;
    $emojis = settings.emoji?.list ?? [];
    $mutebykinds = settings.mutebykinds?.list ?? [];
    $defaultReaction = settings.defaultReaction;
    $selectedRelayset = settings.useRelaySet;
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
    if (relayRegex.test(input)) {
      settings.relays = [
        ...settings.relays,
        { url: input, read: true, write: true },
      ];
      relayInput = "";
    }
  }

  function removeRelay(index: number) {
    settings.relays.filter((_, i) => i !== index);
  }

  function saveSettings() {
    console.log("save");
    if (isRelaySelectionInvalid()) return;
    if (!isPubkeyValid()) return;

    createCurrentSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    toastSettings.set({
      title: "Success",
      description: "saved",
      color: "bg-green-500",
    });

    $loginUser = settings.pubkey;
    $showImg = settings.showImg;
    $showPreview = settings.showPreview;
    $menuLeft = settings.menuleft;
    $showRelayIcon = settings.showRelayIcon;
    $mutes = settings.mute.list;
    $emojis = settings.emoji.list;
    $mutebykinds = settings.mutebykinds.list;
    $defaultReaction = settings.defaultReaction;

    originalSettings.set({ ...settings });
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

  function createCurrentSettings() {
    let pub: string = "";
    try {
      pub = nip19.decode(inputPubkey).data as string;
      settings.pubkey = pub;
    } catch (error) {
      console.log(error);
    }
  }

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

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (settingsChanged()) {
      e.preventDefault();
      e.returnValue = "";
    }
  }

  onDestroy(() => {
    if (browser) {
      window?.removeEventListener("beforeunload", handleBeforeUnload);
    }
  });

  beforeNavigate(({ cancel }) => {
    if (settingsChanged()) {
      if (
        !confirm(
          "You have unsaved changes. Are you sure you want to leave this page?"
        )
      ) {
        cancel();
      }
    }
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
</script>

<div class=" flex flex-col gap-3">
  <div class="text-sm break-all">
    <div>[pubkey]</div>
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
  </div>
  <!-- ラジオボタン -->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">Relay</div>
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
            <button on:click={() => removeRelay(index)}>✕</button>
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
      <div class="text-sm ml-4">
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
        {$_("settings.globalRelay")}
      </div>
    {/if}
  </div>
  <!--投稿の設定-->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">Default Reaction</div>
    <div class="w-fit grid grid-cols-[auto_1fr] gap-2 items-center">
      <CustomReaction
        note={undefined}
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
  </div>
  <!--- 表示設定 --->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">Display</div>
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
    </div>
  </div>
  <!--- Douki --->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class=" text-magnum-200 font-bold text-lg">
      {$_("settings.douki.title")}
    </div>
    <!--mute-->
    <div class="mt-2">
      <UpdateMuteList
        bind:pubkey={settings.pubkey}
        bind:muteList={settings.mute}
      />
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
      <UpdateMutebykindList
        bind:pubkey={settings.pubkey}
        bind:mutebykindList={settings.mutebykinds}
      />
    </div>
    {#if $loginUser}
      <a
        class="underline text-magnum-300 break-all ml-4 text-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://nostviewstr.vercel.app/{nip19.npubEncode(
          $loginUser
        )}/30007"
        >{$_("settings.nostviewstr.kind30007")}
      </a>
    {/if}
    <!--emoji-->
    <div class="mt-4">
      <UpdateEmojiList
        bind:pubkey={settings.pubkey}
        bind:emojiList={settings.emoji}
      />
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
  </div>

  <!-- Theme 設定 -->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">theme</div>
    <ThemeSwitch />
  </div>
  <div
    class="border border-magnum-500 rounded-md flex flex-row items-center gap-4 mt-1 justify-center p-2"
  >
    <button
      class=" rounded-md bg-magnum-600 w-24 h-10 flex justify-center items-center gap-1 font-bold text-magnum-100 hover:opacity-75 active:opacity-50"
      on:click={saveSettings}><Save />SAVE</button
    >
    <button
      class=" rounded-md bg-magnum-200 w-20 h-10 font-medium text-magnum-800 hover:opacity-75 active:opacity-50"
      on:click={cancelSettings}>CANCEL</button
    >
  </div>
</div>
