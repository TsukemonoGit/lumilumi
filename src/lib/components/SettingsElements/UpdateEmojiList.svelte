<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
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
    list = kind10030event.tags.reduce(
      (acc: string[][], [tag, shortcode, url]) => {
        if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
          return [...acc, [shortcode, url]];
        } else {
          return acc;
        }
      },
      []
    );

    const naddrFilters: { id: string; filter: Nostr.Filter }[] = (
      kind10030event.tags as string[][]
    ).reduce(
      (acc: { id: string; filter: Nostr.Filter }[], [tag, value]) => {
        console.log(tag, value);
        if (tag === "a") {
          const matches = value.match(nip33Regex);
          console.log(matches);
          if (matches) {
            const filter: Nostr.Filter = {
              kinds: [Number(matches[1])],
              authors: [matches[2]],
              "#d": [matches[3]],
              limit: 1,
            };

            // フィルタを結果に追加
            acc.push({ id: value, filter: filter });
          }
        }
        return acc;
      },
      [] as { id: string; filter: Nostr.Filter }[]
    );

    console.log(naddrFilters);
    const chunkedFilters = chunkArray(
      naddrFilters.map((fil) => fil.filter),
      20
    );
    const rxNostr = createRxNostr({
      verifier: get(verifier) ?? cryptoVerifier,
    });
    // const latestEventsMap = await getNaddrEmojiList(
    //   rxNostr,
    //   naddrFilters.map((filter) => filter.filter),
    //   relays
    // );//これするとでーたとれない
    // console.log(latestEventsMap);

    // 全てのチャンクを並列で処理する
    const pkListArray = await Promise.all(
      chunkedFilters.map((chunk) => getNaddrEmojiList(rxNostr, chunk, relays))
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
      const sortedLatestEvents = naddrFilters.map((filter) => {
        const id = filter.id;
        const event = Array.from(latestEventsMap.values()).find((pk) => {
          const kind = pk.event.kind;
          const pubkey = pk.event.pubkey;
          const dTag = pk.event.tags.find((tag) => tag[0] === "d")?.[1];
          return `${kind}:${pubkey}:${dTag}` === id;
        });
        return event;
      });

      // 各チャンクの結果を結合する
      sortedLatestEvents.forEach((pk) => {
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

      //   // console.log(list.length);
      //   $emojis = {
      //     list: list,
      //     updated: Math.floor(Date.now() / 1000),
      //     event: event,
      //   };

      //   localStorage.setItem("lumiEmoji", JSON.stringify($emojis));
      // }

      // sortedLatestEvents.forEach((pk) => {
      //   if (pk && pk.event) {
      //     list = [
      //       ...list,
      //       ...pk.event.tags.reduce((acc: string[][], [tag, shortcode, url]) => {
      //         if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
      //           return [...acc, [shortcode, url]];
      //         } else {
      //           return acc;
      //         }
      //       }, []),
      //     ];
      //   }
      // });
      $emojis = {
        list: list,
        updated: Math.floor(Date.now() / 1000),
        event: kind10030event,
      };

      localStorage.setItem("lumiEmoji", JSON.stringify($emojis));
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
      {/if}<a
        class="underline text-magnum-300 break-all ml-4 text-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="https://nostviewstr.vercel.app/{nip19.npubEncode(
          $loginUser
        )}/10030"
        >{$_("settings.nostviewstr.kind10030")}
      </a>
    </div>
  {/snippet}
</Dialog>
