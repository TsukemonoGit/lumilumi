<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    getDoukiList,
    getMuteByList,
    getMutebykindList,
    getQueryRelays,
    toMuteList,
  } from "$lib/func/settings";
  import type { MuteList } from "$lib/types";
  import { formatAbsoluteDate } from "$lib/func/util";
  import Dialog from "./Elements/Dialog.svelte";
  import { nip19 } from "nostr-tools";
  import { mutebykinds, nowProgress } from "$lib/stores/stores";
  import { npubEncode } from "nostr-tools/nip19";

  export let pubkey: string;
  export let mutebykindList:
    | { list: { kind: number; list: string[] }[]; updated: number }
    | undefined = undefined;
  let dialogOpen: any;
  async function handleClickMuteByKind() {
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
      return;
    }
    const relays = await getQueryRelays(pubkey);
    console.log(relays);
    if (!relays) {
      return;
    }
    $nowProgress = true;
    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [30007], authors: [pubkey] },
    ];
    const pk = await getMutebykindList(filters, relays);
    console.log(pk);
    if (pk.length > 0) {
      mutebykindList = {
        list: await getMuteByList(pk),
        updated: Math.floor(Date.now() / 1000),
      };
      console.log(mutebykindList.list);
    }
    $nowProgress = false;
  }
</script>

<button
  disabled={$nowProgress}
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
  on:click={handleClickMuteByKind}>MuteByKind</button
><span class="ml-2"
  >最終更新日時：{mutebykindList
    ? formatAbsoluteDate(mutebykindList?.updated)
    : ""}</span
>{#if mutebykindList}<button
    class="rounded-md border ml-2 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    {#if mutebykindList}
      <h2 class="m-0 text-lg font-medium">Mute By Kind</h2>
      {#each mutebykindList.list as list, index}
        {#if list.list && list.list.length > 0}
          <h2 class="m-0 text-lg font-medium">
            kind:{list.kind}
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
  </div>
</Dialog>
