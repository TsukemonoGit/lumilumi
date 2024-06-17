<script lang="ts">
  import { type DefaultRelayConfig } from "rx-nostr";
  import { getContext, onMount } from "svelte";
  import { derived, writable } from "svelte/store";
  import { createLabel, createRadioGroup, melt } from "@melt-ui/svelte";

  import * as Nostr from "nostr-typedef";
  import ThemeSwitch from "./Elements/ThemeSwitch/ThemeSwitch.svelte";
  import {
    app,
    emojis,
    loginUser,
    mutes,
    mutebykinds,
    showImg,
    toastSettings,
  } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";
  import { relayRegex } from "$lib/func/util";
  import type { LumiSetting } from "$lib/types";

  //  import { promiseRelaySet } from "$lib/stores/promiseRelaySet";

  import type { MuteList } from "$lib/types";
  import UpdateEmojiList from "./UpdateEmojiList.svelte";
  import UpdateMuteList from "./UpdateMuteList.svelte";
  import UpdateMutebykindList from "./UpdateMutebykindList.svelte";

  const relays = writable<DefaultRelayConfig[]>([]);

  const STORAGE_KEY = "lumiSetting";
  const Delete_STORAGE_KEY = "relaySettings";
  const radioGroupSelected = writable("0");
  const pubkey = writable("");
  const _showImg = writable<boolean>(false);
  let relayInput: string = "";
  let muteList: { list: MuteList; updated: number } | undefined = undefined;
  let mutebykindList:
    | { list: { kind: number; list: string[] }[]; updated: number }
    | undefined = undefined;
  let emojiList: { list: string[][]; updated: number } | undefined = undefined;

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
  const optionsArrStr = ["kind:10002 を使う", "設定したリレーを使う"];
  //inputurl
  const {
    elements: { root: relayInputroot },
  } = createLabel();

  // ローカルストレージから設定を読み込む
  onMount(async () => {
    const deletesettings = localStorage.getItem(Delete_STORAGE_KEY);
    let savedSettings = localStorage.getItem(STORAGE_KEY);
    if (deletesettings) {
      savedSettings = deletesettings;
      localStorage.setItem(STORAGE_KEY, savedSettings);
      localStorage.removeItem(Delete_STORAGE_KEY);
    }
    if (savedSettings) {
      const {
        relays: savedRelays,
        useRelaySet: savedRelaySet,
        pubkey: savedPubkey,
        showImg: savedShowImg,
        mute: savedMute,
        emoji: savedEmoji,
        mutebykinds: savedMutebykinds,
      }: LumiSetting = JSON.parse(savedSettings);
      relays.set(savedRelays);
      radioGroupSelected.set(savedRelaySet);
      pubkey.set(savedPubkey);
      if (savedShowImg) {
        _showImg.set(savedShowImg);
      }
      if (savedMute) {
        muteList = savedMute;
      }
      if (savedEmoji) emojiList = savedEmoji;
      if (savedMutebykinds?.list) {
        mutebykindList = {
          list: JSON.parse(savedMutebykinds.list),
          updated: savedMutebykinds.updated,
        };
        $mutebykinds = mutebykindList.list;
      }
    } else {
      radioGroupSelected.set("0");
      try {
        const gotPubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        ).getPublicKey();
        if (gotPubkey) {
          pubkey.set(gotPubkey);
        }
      } catch (error) {
        console.log(error);
      }
    }
  });

  function addRelay() {
    if (!relayInput) return;
    let input = relayInput.trim();
    if (!input.endsWith("/")) {
      input = input + "/";
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
    if ($radioGroupSelected === "1") {
      const currentRelays = $relays;
      const hasRead = currentRelays.some((relay) => relay.read);
      const hasWrite = currentRelays.some((relay) => relay.write);
      if (!hasRead || !hasWrite) {
        //console.log("toast");

        $toastSettings = {
          title: "Error",
          description:
            "リレーのリストには少なくとも1つの読み取りと書き込み可能なリレーが含まれている必要があります。",
          color: "bg-red-500",
        };
        return;
      }
    }
    if (!$pubkey || $pubkey === "") {
      $toastSettings = {
        title: "Error",
        description: "error pubkey",
        color: "bg-red-500",
      };
      return;
    }
    console.log(mutebykindList);
    const settings = {
      relays: $relays,
      useRelaySet: $radioGroupSelected,
      pubkey: $pubkey,
      showImg: $_showImg,
      mute: muteList,
      emoji: emojiList,
      mutebykinds: mutebykindList
        ? {
            list: JSON.stringify(mutebykindList.list),
            updated: mutebykindList.updated,
          }
        : {},
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    $toastSettings = {
      title: "Success",
      description: "設定が保存されました。",
      color: "bg-green-500",
    };
    $loginUser = $pubkey;
    $showImg = $_showImg;
    if (muteList) {
      $mutes = muteList.list;
    }
    if (emojiList) {
      $emojis = emojiList.list;
    }
    if (mutebykindList) {
      $mutebykinds = mutebykindList.list;
    }
  }

  function cancelSettings() {
    console.log("cansel");
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const {
        relays: savedRelays,
        useRelaySet: savedRelaySet,
        pubkey: savedPubkey,
        showImg: savedShowImg,
        mute: savedMute,
        emoji: savedEmoji,
        mutebykinds: savedMutebykinds,
      }: LumiSetting = JSON.parse(savedSettings);
      relays.set(savedRelays);
      radioGroupSelected.set(savedRelaySet);
      pubkey.set(savedPubkey);
      muteList = savedMute;
      emojiList = savedEmoji;
      mutebykindList = savedMutebykinds?.list
        ? {
            list: JSON.parse(savedMutebykinds.list),
            updated: savedMutebykinds.updated,
          }
        : undefined;

      if (savedShowImg !== undefined) {
        showImg.set(savedShowImg);
      }

      $toastSettings = {
        title: "Warning",
        description: "設定がリセットされました。",
        color: "bg-orange-500",
      };
    }
  }
  const handleClickLogin = async () => {
    try {
      const gotPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      ).getPublicKey();
      if (gotPubkey) {
        pubkey.set(gotPubkey);
      }
    } catch (error) {
      console.log(error);
    }
  };
</script>

<div class="container flex flex-col gap-3">
  <div class="text-sm opacity-50 break-all">
    {#if $pubkey !== ""}
      <div>[pubkey]</div>
      {nip19.npubEncode($pubkey)}
    {:else}
      <button
        class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        on:click={handleClickLogin}>Login</button
      >
    {/if}
  </div>
  <!-- ラジオボタン -->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">relay</div>
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
        NostViewstr で Relaylist (kind:10002) を編集する
      </a>
    {/if}
  </div>
  <!--- 表示設定 --->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">display</div>
    <label>
      <input
        type="checkbox"
        class="rounded-checkbox"
        bind:checked={$_showImg}
      />
      load and show image
    </label>
  </div>
  <!--- Douki --->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class=" text-magnum-200 font-bold text-lg">douki</div>
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
        NostViewstr で MuteList ( kind:10000 ) を編集する
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
      >
        NostViewstr で MutebykindList ( kind:30007 ) を編集する
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
      >
        NostViewstr で EmojiList ( kind:10030 ) を編集する
      </a>
    {/if}
  </div>

  <!-- Theme 設定 -->
  <div class="border border-magnum-500 rounded-md p-2">
    <div class="text-magnum-200 font-bold text-lg">theme</div>
    <ThemeSwitch />
  </div>
  <div class="flex flex-row items-start gap-4 mt-4">
    <button
      class=" rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
      on:click={saveSettings}>SAVE</button
    >
    <button
      class=" rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
      on:click={cancelSettings}>CANSEL</button
    >
  </div>
</div>
