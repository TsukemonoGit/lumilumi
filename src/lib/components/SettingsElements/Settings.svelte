<script lang="ts">
  import { type DefaultRelayConfig } from "rx-nostr";
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
  } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";
  import { relayRegex } from "$lib/func/util";
  import type { LumiSetting, MuteList } from "$lib/types";
  import { _ } from "svelte-i18n";
  import { beforeNavigate } from "$app/navigation";
  import { browser } from "$app/environment";
  import UpdateEmojiList from "./UpdateEmojiList.svelte";
  import UpdateMutebykindList from "./UpdateMutebykindList.svelte";
  import UpdateMuteList from "./UpdateMuteList.svelte";

  const STORAGE_KEY = "lumiSetting";
  const DELETE_STORAGE_KEY = "relaySettings";

  const relays = writable<DefaultRelayConfig[]>([]);
  const radioGroupSelected = writable("0");
  const pubkey = writable("");
  const _showImg = writable<boolean>(false);
  const _showPreview = writable<boolean>(false);
  const _menu_left = writable<boolean>(false);
  const originalSettings = writable<LumiSetting | null>(null);

  let relayInput: string = "";
  let muteList: { list: MuteList; updated: number } | undefined = undefined;
  let mutebykindList:
    | { list: { kind: number; list: string[] }[]; updated: number }
    | undefined = undefined;
  let emojiList: { list: string[][]; updated: number } | undefined = undefined;
  let inputPubkey = "";
  // ラジオボタン設定
  const {
    elements: {
      root: radioGrouproot,
      item: radioGroupitem,
      hiddenInput: radioGrouphiddenInput,
    },
    helpers: { isChecked: radioGroupisChecked },
  } = createRadioGroup({
    defaultValue: "0",
    value: radioGroupSelected,
  });
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
    if (savedSettings) {
      applySettings(savedSettings);
    } else {
      initializeSettings();
    }
    window?.addEventListener("beforeunload", handleBeforeUnload);
  });

  function loadSettings() {
    const deleteSettings = localStorage.getItem(DELETE_STORAGE_KEY);
    let savedSettings = localStorage.getItem(STORAGE_KEY);
    if (deleteSettings) {
      savedSettings = deleteSettings;
      localStorage.setItem(STORAGE_KEY, savedSettings);
      localStorage.removeItem(DELETE_STORAGE_KEY);
    }
    return savedSettings ? JSON.parse(savedSettings) : null;
  }

  function applySettings(settings: LumiSetting) {
    const {
      relays: savedRelays,
      useRelaySet: savedRelaySet,
      pubkey: savedPubkey,
      showImg: savedShowImg,
      menuleft: savedMenuLeft,
      showPreview: savedShowPreview,
      mute: savedMute,
      emoji: savedEmoji,
      mutebykinds: savedMutebykinds,
    } = settings;

    relays.set(savedRelays);
    radioGroupSelected.set(savedRelaySet);
    pubkey.set(savedPubkey);
    inputPubkey = nip19.npubEncode(savedPubkey);
    if (savedShowImg) _showImg.set(savedShowImg);
    if (savedShowPreview) _showPreview.set(savedShowPreview);
    if (savedMenuLeft) _menu_left.set(savedMenuLeft);
    if (savedMute) muteList = savedMute;
    if (savedEmoji) emojiList = savedEmoji;
    if (savedMutebykinds?.list) {
      mutebykindList = {
        list: JSON.parse(savedMutebykinds.list),
        updated: savedMutebykinds.updated,
      };
      mutebykinds.set(mutebykindList.list);
    }
    originalSettings.set(settings);
  }

  async function initializeSettings() {
    radioGroupSelected.set("0");
    try {
      const gotPubkey = await (
        window?.nostr as Nostr.Nip07.Nostr
      ).getPublicKey();
      if (gotPubkey) {
        // pubkey.set(gotPubkey);
      }
    } catch (error) {
      console.log(error);
    }
  }

  function addRelay() {
    if (!relayInput) return;
    let input = relayInput.trim();
    if (!input.endsWith("/")) {
      input += "/";
    }
    if (relayRegex.test(input)) {
      relays.update((current) => [
        ...current,
        { url: input, read: true, write: true },
      ]);
      relayInput = "";
    }
  }

  function removeRelay(index: number) {
    relays.update((current) => current.filter((_, i) => i !== index));
  }

  function saveSettings() {
    console.log("save");
    if (isRelaySelectionInvalid()) return;
    if (!isPubkeyValid()) return;

    const settings: LumiSetting = createCurrentSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    toastSettings.set({
      title: "Success",
      description: "saved",
      color: "bg-green-500",
    });

    $loginUser = $pubkey;
    $showImg = $_showImg;
    $showPreview = $_showPreview;
    $menuLeft = $_menu_left;
    if (muteList) mutes.set(muteList.list);
    if (emojiList) emojis.set(emojiList.list);
    if (mutebykindList) mutebykinds.set(mutebykindList.list);

    originalSettings.set(settings);
  }

  function isRelaySelectionInvalid() {
    if ($radioGroupSelected === "1") {
      const currentRelays = $relays;
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
    if (!inputPubkey) {
      toastSettings.set({
        title: "Error",
        description: "error pubkey",
        color: "bg-red-500",
      });
      return false;
    }
    try {
      pubkey.set(nip19.decode(inputPubkey).data as string);
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

  function createCurrentSettings(): LumiSetting {
    const settings: LumiSetting = {
      relays: $relays,
      useRelaySet: $radioGroupSelected,
      pubkey: $pubkey,
      showImg: $_showImg,
      showPreview: $_showPreview,
      menuleft: $_menu_left,
    };
    if (muteList && muteList.updated !== undefined) {
      settings.mute = muteList;
    }
    if (emojiList && emojiList.updated !== undefined) {
      settings.emoji = emojiList;
    }
    if (mutebykindList) {
      settings.mutebykinds = {
        list: JSON.stringify(mutebykindList.list),
        updated: mutebykindList.updated,
      };
    }
    return settings;
  }

  function cancelSettings() {
    console.log("cancel");
    const savedSettings = loadSettings();
    if (savedSettings) {
      applySettings(savedSettings);
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

  function settingsChanged(): boolean {
    const currentSettings = createCurrentSettings();
    if ($originalSettings) {
      return (
        JSON.stringify($originalSettings) !== JSON.stringify(currentSettings)
      );
    }
    return true;
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

    {#if $radioGroupSelected === "1"}
      <div class="w-fit ml-8">
        {#each $relays as relay, index}
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
  <!--- 表示設定 --->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">Display</div>
    <div class="flex flex-col gap-2">
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={$_showImg}
        />
        {$_("settings.display.loadImage")}
      </label>
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={$_showPreview}
        />
        {$_("settings.display.preview")}
      </label>
      <label>
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={$_menu_left}
        />
        {$_("settings.display.menu")}
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
      <UpdateMuteList bind:pubkey={$pubkey} bind:muteList />
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
      <UpdateMutebykindList bind:pubkey={$pubkey} bind:mutebykindList />
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
      <UpdateEmojiList bind:pubkey={$pubkey} bind:emojiList />
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
    class="border border-magnum-500 rounded-md flex flex-row items-start gap-4 mt-1 justify-center p-2"
  >
    <button
      class=" rounded-md bg-magnum-200 px-3 py-2 font-medium text-magnum-900 hover:opacity-75 active:opacity-50"
      on:click={saveSettings}>SAVE</button
    >
    <button
      class=" rounded-md bg-magnum-600 px-3 py-2 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
      on:click={cancelSettings}>CANSEL</button
    >
  </div>
</div>
