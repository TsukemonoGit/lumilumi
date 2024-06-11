<script lang="ts">
  import { getPublicKey, type DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { createLabel, createRadioGroup, melt } from "@melt-ui/svelte";
  import type { ChangeFn } from "@melt-ui/svelte/internal/helpers";
  import { relayRegex } from "$lib/func/nostr";
  import * as Nostr from "nostr-typedef";
  import X from "lucide-svelte/icons/x";
  import ThemeSwitch from "./Elements/ThemeSwitch/ThemeSwitch.svelte";
  import { toastSettings } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";

  const relays = writable<DefaultRelayConfig[]>([]);

  const STORAGE_KEY = "relaySettings";
  const useConfiguredRelays = writable<boolean>(true);
  const radioGroupSelected = writable("0");
  const pubkey = writable("");
  let relayInput: string = "";

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
    "kind10002(もしくはkind3)をつかう",
    "設定したリレーを使う",
  ];
  //inputurl
  const {
    elements: { root: relayInputroot },
  } = createLabel();

  // ローカルストレージから設定を読み込む
  onMount(async () => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const {
        relays: savedRelays,
        useRelaySet: savedRelaySet,
        pubkey: savedPubkey,
      } = JSON.parse(savedSettings);
      relays.set(savedRelays);
      radioGroupSelected.set(savedRelaySet);
      pubkey.set(savedPubkey);
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
    const input = relayInput.trim();
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
    const settings = {
      relays: $relays,
      useRelaySet: $radioGroupSelected,
      pubkey: $pubkey,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    $toastSettings = {
      title: "Success",
      description: "設定が保存されました。",
      color: "bg-green-500",
    };
  }

  function cancelSettings() {
    console.log("cansel");
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const { relays: savedRelays, useRelaySet: savedRelaySet } =
        JSON.parse(savedSettings);
      relays.set(savedRelays);
      radioGroupSelected.set(savedRelaySet);

      $toastSettings = {
        title: "Warning",
        description: "設定がリセットされました。",
        color: "bg-orange-500",
      };
    }
  }
</script>

<div class="container flex flex-col gap-3">
  <div class="text-sm opacity-50 break-all">
    <div>[pubkey]</div>
    {nip19.npubEncode($pubkey)}
  </div>
  <!-- ラジオボタン -->
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

  <!------>

  <ThemeSwitch />

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
