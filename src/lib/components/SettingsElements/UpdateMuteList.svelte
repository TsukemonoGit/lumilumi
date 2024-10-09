<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { getDoukiList, getQueryRelays, toMuteList } from "$lib/func/settings";
  import type { LumiMute, MuteList } from "$lib/types";
  import { formatAbsoluteDate } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { nowProgress, toastSettings } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { _ } from "svelte-i18n";

  export let pubkey: string;
  export let muteList: LumiMute | undefined;
  let dialogOpen: any;
  async function handleClickMute() {
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
        description: "relay list not found ",
        color: "bg-red-500",
      };
      return;
    }
    $nowProgress = true;
    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [10000], authors: [pubkey] },
    ];
    const pk = await getDoukiList(filters, relays);
    // console.log(event);

    console.log(pk);
    if (pk) {
      if (
        !muteList?.event ||
        pk.event.created_at >= muteList.event.created_at
      ) {
        muteList = {
          list: await toMuteList(pk.event),
          updated: Math.floor(Date.now() / 1000),
          event: pk.event,
        };
      }
    } else {
      $toastSettings = {
        title: "Warning",
        description: "mute list not found ",
        color: "bg-red-500",
      };
    }

    $nowProgress = false;
  }
</script>

<button
  disabled={$nowProgress}
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  on:click={handleClickMute}>Mute</button
><time class="ml-2"
  >{$_("settings.lastUpdated")}: {muteList
    ? formatAbsoluteDate(muteList?.updated)
    : ""}</time
>{#if muteList}<button
    class="rounded-md border ml-2 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    {#if muteList}
      <h2 class="m-0 text-lg font-medium">Event</h2>
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[15vh]"
      >
        {#each muteList.list.e as e, index}
          <li>{index}, {e}</li>
        {/each}
      </ul>

      <h2 class="m-0 text-lg font-medium">User</h2>
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[15vh]"
      >
        {#each muteList.list.p as p, index}
          <li>{index}, {nip19.npubEncode(p)}</li>
        {/each}
      </ul>
      <h2 class="m-0 text-lg font-medium">Hashtag</h2>
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[15vh]"
      >
        {#each muteList.list.t as t, index}
          <li>{index}, {t}</li>
        {/each}
      </ul>
      <h2 class="m-0 text-lg font-medium">Word</h2>
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[15vh]"
      >
        {#each muteList.list.word as word, index}
          <li>{index}, {word}</li>
        {/each}
      </ul>
    {/if}
  </div>
</Dialog>
