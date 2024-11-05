<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    getMuteByList,
    getMutebykindList,
    getQueryRelays,
  } from "$lib/func/settings";
  import { formatAbsoluteDate } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import {
    loginUser,
    mutebykinds,
    nowProgress,
    toastSettings,
  } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { _ } from "svelte-i18n";
  import type { LumiMuteByKind } from "$lib/types";
  import { eventKinds } from "$lib/func/kinds";
  import { locale } from "svelte-i18n";
  import { Image } from "lucide-svelte";

  export let pubkey: string;
  // export let mutebykindList: LumiMuteByKind | undefined = undefined;

  let dialogOpen: any;
  async function handleClickMuteByKind() {
    const beforeList = $mutebykinds?.list;
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
      $nowProgress = false;
      return;
    }
    const relays = await getQueryRelays(pubkey);

    if (!relays) {
      $toastSettings = {
        title: "Error",
        description: "relay list not found ",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    }
    $nowProgress = true;
    const filters: Nostr.Filter[] = [{ kinds: [30007], authors: [pubkey] }];
    const pk = await getMutebykindList(filters, relays);
    console.log(pk);
    if (pk && pk.length > 0) {
      $mutebykinds = {
        list: await getMuteByList(
          pk.map((p) => p.event),
          beforeList
        ),
        updated: Math.floor(Date.now() / 1000),
      };

      localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
    } else {
      $toastSettings = {
        title: "Warning",
        description: "mute by kind list not found ",
        color: "bg-red-500",
      };
    }
    $nowProgress = false;
  }
</script>

<button
  disabled={$nowProgress}
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  on:click={handleClickMuteByKind}>MuteByKind</button
><time class="ml-2"
  >{$_("settings.lastUpdated")}: {$mutebykinds
    ? formatAbsoluteDate($mutebykinds?.updated)
    : ""}</time
>{#if $mutebykinds}<button
    class="rounded-md border ml-2 p-1 m-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    {#if $mutebykinds}
      <h2 class="m-0 text-lg font-medium">Mute By Kind</h2>
      {#each $mutebykinds.list as list, index}
        {#if list.list && list.list.length > 0}
          {@const kindstr = eventKinds.get(list.kind)}
          <h2 class="m-0 text-lg font-medium">
            kind: {list.kind}
            {kindstr ? `(${kindstr[$locale === "ja" ? "ja" : "en"]})` : ""}
          </h2>
          <ul
            class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[15vh]"
          >
            {#each list.list as p, index}
              <li>{index}, {nip19.npubEncode(p)}</li>
            {/each}
          </ul>
        {/if}
      {/each}
    {/if}

    <a
      class="underline text-magnum-300 break-all ml-4 text-sm"
      target="_blank"
      rel="noopener noreferrer"
      href="https://nostviewstr.vercel.app/{nip19.npubEncode($loginUser)}/30007"
      >{$_("settings.nostviewstr.kind30007")}
    </a>
  </div>
</Dialog>
