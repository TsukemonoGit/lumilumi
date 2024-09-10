<script lang="ts">
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Contacts from "./NostrMainData/Contacts.svelte";

  import { getFollowingList, pubkeysIn, setTieKey } from "$lib/func/nostr";

  import TimelineList from "./NostrMainData/TimelineList.svelte";

  import {
    loginUser,
    queryClient,
    showKind16,
    showReactioninTL,
    showUserStatus,
  } from "$lib/stores/stores";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "./OpenPostWindow.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { extractKind9734 } from "$lib/func/makeZap";
  import FolloweeFilteredEventList from "./NostrElements/FolloweeFilteredEventList.svelte";
  import Link from "./Elements/Link.svelte";
  import { SquareArrowOutUpRight } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import { _ } from "svelte-i18n";

  let amount = 50; //1ページに表示する量
  let viewIndex = 0;
  const tieKey = "timeline";
  let isOnMount = false;
  let since: number | undefined = undefined;
  const timelineQuery: QueryKey = ["timeline", "feed", $loginUser];

  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });
  afterNavigate(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });

  async function init() {
    since = undefined;
    setTieKey(tieKey);
    const ev: EventPacket[] | undefined = $queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now() - 15 * 60; //15分くらいならもれなく取れることとして初期sinceを15分前に設定することで、初期読込時間を短縮する
    } else {
      since = ev[0].event.created_at;
    }
  }

  const makeFilters = (contacts: Nostr.Event<number>): Nostr.Filter[] => {
    //console.log(contacts);
    const pubkeyList = pubkeysIn(contacts, $loginUser);
    const kinds = [1, 6];
    if ($showKind16) {
      kinds.push(16);
    }
    const filters: Nostr.Filter[] = [
      {
        authors: pubkeyList,
        kinds: kinds,
        since: since,
      },
    ];

    if ($showReactioninTL) {
      filters.push({
        kinds: [
          42 /*チャンネルのリプライ*/, 1 /*リプライ*/, 6 /*kind1のリポスト*/,
          /*16,kind1以外のリポスト（ktag）*/ 7 /*リアクション kタグ*/,
          9735 /*zap receipt**/,
        ],
        "#p": [$loginUser],
        since: since,
      });
    } //とりあえず通知をTLに流したくないときは フィルターから外してみる

    if ($showUserStatus) {
      filters.push({
        kinds: [30315],
        authors: pubkeyList,
      });
    }
    console.log(filters);
    return filters;
  };

  export const getFollowFilteredEvents = (
    events: Nostr.Event[],
    onlyFollowee: boolean
  ) => {
    const followee = getFollowingList();
    if (onlyFollowee && followee) {
      return events.filter((event) => {
        if (event.kind !== 9735) {
          return followee.includes(event.pubkey);
        } else {
          const kind9734 = extractKind9734(event);
          return kind9734 && followee.includes(kind9734.pubkey);
        }
      });
    } else {
      return events;
    }
  };
</script>

<Contacts
  queryKey={["timeline", "contacts", $loginUser]}
  pubkey={$loginUser}
  let:contacts
  let:status
  ><div slot="loading">loading</div>
  <div slot="error">error</div>
  <div slot="nodata">nodata</div>
  {#if since}
    <TimelineList
      queryKey={timelineQuery}
      filters={makeFilters(contacts)}
      req={createRxForwardReq()}
      {tieKey}
      let:events
      {viewIndex}
      {amount}
      reaCheck={$showReactioninTL}
      let:len
    >
      <!-- <SetRepoReactions /> -->
      <div slot="loading">
        <Link
          className="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all "
          href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/3`}
          >{$_("nostviewstr.kind3")}<SquareArrowOutUpRight size={16} /></Link
        >
      </div>

      <div slot="error" let:error>
        <Link
          className="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all "
          href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/3`}
          >{$_("nostviewstr.kind3")}<SquareArrowOutUpRight size={16} /></Link
        >
      </div>

      <div
        class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
      >
        <FolloweeFilteredEventList {events} />
      </div>
    </TimelineList>
  {/if}
</Contacts>

<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
