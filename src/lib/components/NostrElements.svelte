<script lang="ts">
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Contacts from "./NostrMainData/Contacts.svelte";

  import { pubkeysIn } from "$lib/func/nostr";

  import TimelineList from "./NostrMainData/TimelineList.svelte";

  import {
    followList,
    loginUser,
    queryClient,
    showKind16,
    showReactioninTL,
    showUserStatus,
  } from "$lib/stores/stores";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "./OpenPostWindow.svelte";
  import { type QueryKey } from "@tanstack/svelte-query";
  import { extractKind9734 } from "$lib/func/makeZap";
  import FolloweeFilteredEventList from "./NostrElements/FolloweeFilteredEventList.svelte";

  import { _ } from "svelte-i18n";
  import { awaitInterval } from "$lib/func/util";
  import MakeNewKind3 from "./NostrElements/Note/MakeNewKind3.svelte";
  import SampleGlobalLink from "./NostrElements/Note/SampleGlobalLink.svelte";

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
  afterNavigate((navigate) => {
    console.log("afterNavigate", navigate.type);
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });

  async function init() {
    since = undefined;

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
        authors: Array.from(pubkeyList.keys()),
        kinds: kinds,
        since: since,
      },
    ];

    if ($showReactioninTL) {
      filters.push({
        kinds: [
          42 /*チャンネルのリプライ*/, 1 /*リプライ*/, 6 /*kind1のリポスト*/,
          /*16,kind1以外のリポスト（ktag）*/ 7 /*リアクション kタグ*/, 1059,
          9735 /*zap receipt**/,
        ],
        "#p": [$loginUser],
        since: since,
      });
    } //とりあえず通知をTLに流したくないときは フィルターから外してみる

    if ($showUserStatus) {
      filters.push({
        kinds: [30315],
        authors: Array.from(pubkeyList.keys()),
      });
    }
    console.log(filters);
    return filters;
  };

  export const getFollowFilteredEvents = (
    events: Nostr.Event[],
    onlyFollowee: boolean
  ) => {
    if (onlyFollowee && $followList) {
      return events.filter((event) => {
        if (event.kind !== 9735) {
          return $followList.has(event.pubkey);
        } else {
          const kind9734 = extractKind9734(event);
          return kind9734 && $followList.has(kind9734.pubkey);
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
>
  <div slot="loading">
    {#await awaitInterval(3000) then}
      <MakeNewKind3 />{/await}
  </div>
  <div slot="error"><MakeNewKind3 /></div>
  <div slot="nodata"><MakeNewKind3 /></div>
  {#if since}
    <TimelineList
      queryKey={timelineQuery}
      filters={makeFilters(contacts)}
      req={createRxForwardReq()}
      {tieKey}
      let:events
      {viewIndex}
      {amount}
      let:len
    >
      <!-- <SetRepoReactions /> -->
      <div slot="loading">
        {#await awaitInterval(3000) then}event loading <SampleGlobalLink
          />{/await}
      </div>

      <div slot="error" let:error>error</div>

      <div
        class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
      >
        <FolloweeFilteredEventList {events} {tieKey} />
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
