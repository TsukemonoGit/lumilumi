<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    getDoukiList,
    getNaddrEmojiList,
    getQueryRelays,
  } from "$lib/func/settings";
  import {
    emojiShortcodeRegex,
    formatAbsoluteDate,
    nip33Regex,
  } from "$lib/func/util";
  import { nowProgress, showImg, toastSettings } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { _ } from "svelte-i18n";
  import type { EventPacket } from "rx-nostr";

  export let pubkey: string;
  export let emojiList: { list: string[][]; updated: number } | undefined;
  let dialogOpen: any;
  async function handleClickEmoji() {
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
      { limit: 1, kinds: [10030], authors: [pubkey] },
    ];
    const pk = await getDoukiList(filters, relays);
    // console.log(event);
    if (!pk) {
      $toastSettings = {
        title: "Warning",
        description: "emoji list not found",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    }
    list = pk.event.tags.reduce((acc: string[][], [tag, shortcode, url]) => {
      if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
        return [...acc, [shortcode, url]];
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

    const chunkedFilters = chunkArray(naddrFilters, 4);

    // 全てのチャンクを並列で処理する
    const pkListArray = await Promise.all(
      chunkedFilters.map((chunk) => getNaddrEmojiList(chunk, relays))
    );
    if (pkListArray.length > 0) {
      //重複しないように整える

      // フラット化して一つの配列にする
      const flattenedList = pkListArray.flat();

      // dtag をキーとして最新のイベントをマップに格納
      const latestEventsMap = new Map<string, EventPacket>();

      flattenedList.forEach((packet) => {
        const dTag = packet.event.tags.find((tag) => tag[0] === "d")?.[1];
        if (dTag) {
          const existingEvent = latestEventsMap.get(dTag);
          if (
            !existingEvent ||
            packet.event.created_at > existingEvent.event.created_at
          ) {
            latestEventsMap.set(dTag, packet);
          }
        }
      });

      // 各チャンクの結果を結合する
      latestEventsMap.forEach((pk) => {
        if (pk && pk.event) {
          list = [
            ...list,
            ...pk.event.tags.reduce(
              (acc: string[][], [tag, shortcode, url]) => {
                if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
                  return [...acc, [shortcode, url]];
                } else {
                  return acc;
                }
              },
              []
            ),
          ];
        }
      });

      // console.log(list.length);
      emojiList = { list: list, updated: Math.floor(Date.now() / 1000) };
    }
    $nowProgress = false;
  }

  // フィルターを5個ずつのチャンクに分割する関数
  function chunkArray(array: any[], chunkSize: number) {
    return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
      array.slice(i * chunkSize, i * chunkSize + chunkSize)
    );
  }
</script>

<button
  disabled={$nowProgress}
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  on:click={handleClickEmoji}>Emoji</button
><time class="ml-2"
  >{$_("settings.lastUpdated")}: {emojiList
    ? formatAbsoluteDate(emojiList?.updated)
    : ""}</time
>{#if emojiList}<button
    class="rounded-md border ml-2 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    {#if emojiList}
      <h2 class="m-0 text-lg font-medium">EmojiList</h2>
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
      >
        {#each emojiList.list as e, index}
          <div
            class="grid grid-rows-[auto_auto] border rounded-md border-magnum-500/50"
          >
            {#if $showImg}<img
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
  </div>
</Dialog>
