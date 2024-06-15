<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    getDoukiList,
    getNaddrEmojiList,
    getQueryRelays,
    toMuteList,
  } from "$lib/func/settings";
  import { nip33Regex, type MuteList } from "$lib/types";
  import { formatAbsoluteDate } from "$lib/func/util";
  import Dialog from "./Elements/Dialog.svelte";
  import { nip19 } from "nostr-tools";

  export let pubkey: string;
  export let emojiList: { list: string[][]; updated: number } | undefined;
  let dialogOpen: any;
  async function handleClickMute() {
    let list: string[][] = [];
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
    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [10030], authors: [pubkey] },
    ];
    const pk = await getDoukiList(filters, relays);
    // console.log(event);
    list = pk.event.tags.reduce((acc: string[][], [tag, ...value]) => {
      if (tag === "emoji") {
        return [...acc, value];
      } else {
        return acc;
      }
    }, []);

    const naddrFilters = pk.event.tags.reduce(
      (acc: Nostr.Filter[], [tag, value]) => {
        console.log(tag, value);
        if (tag === "a") {
          const matches = value.match(nip33Regex);
          console.log(matches);
          if (matches) {
            const filter: Nostr.Filter = {
              kinds: [Number(matches[1])],
              authors: [matches[2]],
              "#d": [matches[3]],
              //limit: 1,
            };

            return [...acc, filter];
          } else {
            return acc;
          }
        } else {
          return acc;
        }
      },
      []
    );
    console.log(naddrFilters);
    const pkList = await getNaddrEmojiList(naddrFilters, relays);
    console.log(pkList);
    pkList.map((pk) => {
      list = [
        ...list,
        ...pk.event.tags.reduce((acc: string[][], [tag, ...value]) => {
          if (tag === "emoji") {
            return [...acc, value];
          } else {
            return acc;
          }
        }, []),
      ];
    });
    emojiList = { list: list, updated: Math.floor(Date.now() / 1000) };
  }
</script>

<button
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
  on:click={handleClickMute}>Emoji</button
><span class="ml-2"
  >最終更新日時：{emojiList ? formatAbsoluteDate(emojiList?.updated) : ""}</span
>{#if emojiList}<button
    class="rounded-md border ml-2 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    {#if emojiList}
      <h2 class="m-0 text-lg font-medium">EmojiList</h2>
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh]"
      >
        {#each emojiList.list as e}
          <li>{e}</li>
        {/each}
      </ul>
    {/if}
  </div>
</Dialog>
