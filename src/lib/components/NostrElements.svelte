<script lang="ts">
  import { now, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Contacts from "./NostrMainData/Contacts.svelte";

  import { makeMainFilters } from "$lib/func/nostr";

  import {
    followList,
    loginUser,
    queryClient,
    timelineFilter,
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
  import MainTimeline from "./NostrMainData/MainTimeline.svelte";
  import { page } from "$app/stores";

  let amount = 50; //1ページに表示する量
  let viewIndex = 0;
  const tieKey = "timeline";
  let isOnMount = false;
  let since: number | undefined = undefined;
  const timelineQuery: QueryKey = ["timeline", "feed", $loginUser];

  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });
  afterNavigate(async (navigate) => {
    console.log("afterNavigate", navigate.type);
    if (!isOnMount) {
      isOnMount = true;
      await init();

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
      const data: EventPacket[] | undefined =
        $queryClient?.getQueryData(timelineQuery);
      if (data && data.length <= 0) {
        since = data[0].event.created_at;
      } else {
        since = ev[0].event.created_at;
      }
    }
  }

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

  function checkCanvasation(
    note: Nostr.Event,

    select: number
  ): boolean {
    if ($page.url.pathname !== "/") {
      return true;
    }

    if (note.kind !== 1 && note.kind !== 42) {
      return true;
    }
    if (select === 0) {
      return true;
    }
    const pTags: string[] = note.tags
      .filter(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] !== note.pubkey
      )
      .map((tag) => tag[1]);

    //ログインユーザーの会話はどれでも表示
    if (note.pubkey === $loginUser || pTags.includes($loginUser)) {
      return true;
    }
    //自分以外のopTags
    if (select === 2) {
      if (pTags.length > 0) {
        return false;
      } else {
        return true;
      }
    }
    if (select === 1) {
      if (pTags.length <= 0) {
        return true;
      }
      // フォローリストに一つも含まれない場合は false を返す
      const hasFollowed = pTags.some((pub) => $followList.has(pub));
      return hasFollowed;
    } else {
      return true;
    }
  }
  let updateViewEvent: any;
  $: if ($timelineFilter && updateViewEvent) {
    //設定が変わったら更新

    updateViewEvent();
  }
</script>

{#if !$loginUser}
  <a
    href="/settings"
    class=" whitespace-pre-wrap break-words p-2 underline text-magnum-400 hover:opacity-75"
    style="word-break: break-word;">{$_("setting.pubkey")}</a
  >
  <SampleGlobalLink />
{:else}
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
      <MainTimeline
        queryKey={timelineQuery}
        filters={makeMainFilters(contacts, since)}
        {tieKey}
        let:events
        {viewIndex}
        {amount}
        let:len
        eventFilter={(note) => {
          return checkCanvasation(note, $timelineFilter.selectCanversation);
        }}
        bind:updateViewEvent
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
      </MainTimeline>
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
{/if}
