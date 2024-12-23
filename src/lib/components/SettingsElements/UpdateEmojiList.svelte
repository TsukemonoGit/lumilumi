<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    createEmojiListFrom10030,
    getDoukiList,
    getNaddrEmojiList,
    getQueryRelays,
  } from "$lib/func/settings";
  import { formatAbsoluteDate } from "$lib/func/util";
  import {
    emojis,
    loginUser,
    nowProgress,
    toastSettings,
    verifier,
  } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { _ } from "svelte-i18n";
  import type { EventPacket } from "rx-nostr";

  import { createRxNostr } from "rx-nostr/src";
  import { get, writable, type Writable } from "svelte/store";
  import { verifier as cryptoVerifier } from "rx-nostr-crypto";
  import { nip19 } from "nostr-tools";
  import { emojiShortcodeRegex, nip33Regex } from "$lib/func/regex";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  interface Props {
    pubkey: string;
  }

  let { pubkey = $bindable() }: Props = $props();
  // export let emojiList: LumiEmoji | undefined;
  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);
  async function handleClickEmoji() {
    const beforeEvent = $emojis?.event;

    try {
      const gotPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      ).getPublicKey();
      if (gotPubkey) {
        pubkey = gotPubkey;
      }
    } catch (error) {
      console.log(error);
    }
    if (pubkey === "") {
      $toastSettings = {
        title: "Error",
        description: "pubkey not found ",
        color: "bg-red-500",
      };
      return;
    }
    const relays = await getQueryRelays(pubkey);
    console.log(relays);
    if (!relays) {
      $toastSettings = {
        title: "Error",
        description: "relay list not found",
        color: "bg-red-500",
      };
      return;
    }
    $nowProgress = true;
    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [10030], authors: [pubkey] },
    ];
    const pk = await getDoukiList(filters, relays);
    // console.log(event);
    if (!pk && !beforeEvent) {
      $toastSettings = {
        title: "Warning",
        description: "emoji list not found",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    }
    const kind10030event =
      !beforeEvent ||
      beforeEvent.pubkey !== pk.event.pubkey ||
      pk.event.created_at >= beforeEvent.created_at
        ? pk.event
        : beforeEvent;

    const rxNostr = createRxNostr({
      verifier: get(verifier) ?? cryptoVerifier,
    });
    const list = await createEmojiListFrom10030(
      kind10030event,
      rxNostr,
      relays
    );

    $emojis = {
      list: list,
      updated: Math.floor(Date.now() / 1000),
      event: kind10030event,
    };

    localStorage.setItem("lumiEmoji", JSON.stringify($emojis));

    $nowProgress = false;
  }
</script>

<button
  disabled={$nowProgress}
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  onclick={handleClickEmoji}>Emoji</button
><time class="ml-2"
  >{$_("settings.lastUpdated")}: {$emojis
    ? formatAbsoluteDate($emojis?.updated)
    : ""}</time
>{#if $emojis}<button
    class="rounded-md border ml-2 p-1 m-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    onclick={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  {#snippet main()}
    <div>
      {#if $emojis}
        <h2 class="m-0 text-lg font-medium">EmojiList</h2>
        <div
          class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
        >
          {#each $emojis.list as e, index}
            <div
              class="grid grid-rows-[auto_auto] border rounded-md border-magnum-500/50"
            >
              {#if lumiSetting.get().showImg}<img
                  loading="lazy"
                  class="h-12 object-contain justify-self-center"
                  src={e[1]}
                  alt={e[0]}
                />{:else}{e[1]}{/if}
              <div class="break-keep">{e[0]}</div>
            </div>
          {/each}
        </div>
      {/if}
      {#if $loginUser}<a
          class="underline text-magnum-300 break-all ml-4 text-sm"
          target="_blank"
          rel="noopener noreferrer"
          href="https://nostviewstr.vercel.app/{nip19.npubEncode(
            $loginUser
          )}/10030"
          >{$_("settings.nostviewstr.kind10030")}
        </a>{/if}
    </div>
  {/snippet}
</Dialog>
