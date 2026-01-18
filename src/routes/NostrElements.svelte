<script lang="ts">
  import { now, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Contacts from "../lib/components/renderSnippets/nostr/Contacts.svelte";

  import { makeMainFilters } from "$lib/func/nostr";

  import { queryClient } from "$lib/stores/stores";
  import { untrack } from "svelte";
  import OpenPostWindow from "../lib/components/OpenPostWindow.svelte";
  import { type QueryKey } from "@tanstack/svelte-query";
  import { extractKind9734 } from "$lib/func/zap";
  import FolloweeFilteredEventList from "../lib/components/NostrElements/FolloweeFilteredEventList.svelte";

  import { t as _ } from "@konemono/svelte5-i18n";
  import { delay } from "$lib/func/util";
  import MakeNewKind3 from "../lib/components/NostrElements/kindEvents/MakeNewKind3.svelte";
  import SampleGlobalLink from "../lib/components/NostrElements/kindEvents/SampleGlobalLink.svelte";
  import MainTimeline from "../lib/components/renderSnippets/nostr/MainTimeline.svelte";
  import { page } from "$app/state";
  import {
    followList,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import LoginUserContacts from "$lib/components/renderSnippets/nostr/LoginUserContacts.svelte";

  let since: number | undefined = $state(undefined);
  let timelineQuery: QueryKey = $derived([
    "timeline",
    "feed",
    lumiSetting.get().pubkey,
  ]);

  $effect(() => {
    if (lumiSetting.get().pubkey) {
      untrack(async () => {
        await init();
      });
    }
  });

  async function init() {
    since = undefined;

    const ev: EventPacket[] | undefined = queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now() - 15 * 60;
    } else {
      const data: EventPacket[] | undefined =
        queryClient?.getQueryData(timelineQuery);
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
    if (onlyFollowee && followList.get()) {
      return events.filter((event) => {
        if (event.kind !== 9735) {
          return followList.get().has(event.pubkey);
        } else {
          const kind9734 = extractKind9734(event);
          return kind9734 && followList.get().has(kind9734.pubkey);
        }
      });
    } else {
      return events;
    }
  };

  function checkCanvasation(note: Nostr.Event, select: number): boolean {
    if (page.url.pathname !== "/") {
      return true;
    }

    if (note.kind !== 1 && note.kind !== 42) {
      return true;
    }
    if (select === 0) {
      return true;
    }
    const pTags: string[] = (note?.tags || [])
      .filter(
        (tag) =>
          tag[0] === "p" && tag.length > 1 && tag[1] !== (note?.pubkey || "")
      )
      .map((tag) => tag[1]);

    if (
      (note?.pubkey || "") === lumiSetting.get().pubkey ||
      pTags.includes(lumiSetting.get().pubkey)
    ) {
      return true;
    }

    if (select === 2) {
      return pTags.length === 0;
    }

    if (select === 1) {
      if (pTags.length <= 0) {
        return true;
      }
      return pTags.some((pub) => followList.get().has(pub));
    }

    return true;
  }

  const excludeKind0 = (note: Nostr.Event): boolean => note.kind !== 0;

  // フィルター関数を合成
  const composeFilters = (
    ...filters: Array<(note: Nostr.Event) => boolean>
  ) => {
    return (note: Nostr.Event) => filters.every((filter) => filter(note));
  };

  // 合成されたイベントフィルター
  const eventFilter = $derived(
    composeFilters(
      (note) => checkCanvasation(note, timelineFilter.selectCanversation),
      excludeKind0
    )
  );
</script>

{#if !lumiSetting.get().pubkey}
  <a
    href="/settings"
    class=" whitespace-pre-wrap break-words p-2 underline text-magnum-400 hover:opacity-75"
    style="word-break: break-word;">{$_("setting.pubkey")}</a
  >
  <SampleGlobalLink />
{:else}
  <LoginUserContacts>
    {#snippet nodata()}
      <div><MakeNewKind3 /></div>
    {/snippet}
    {#snippet content({ contacts, status })}
      {#if since && lumiSetting.get().pubkey}
        <MainTimeline
          queryKey={timelineQuery}
          filters={makeMainFilters(contacts, since).mainFilters}
          olderFilters={makeMainFilters(contacts, since).olderFilters}
          {eventFilter}
        >
          {#snippet content({ events, len })}
            <div
              class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
            >
              <FolloweeFilteredEventList {events} />
            </div>
          {/snippet}
          {#snippet loading()}
            <div>
              {#await delay(3000) then}event loading <SampleGlobalLink
                />{/await}
            </div>
          {/snippet}

          {#snippet error()}
            <div>error</div>
          {/snippet}
        </MainTimeline>
      {/if}
    {/snippet}</LoginUserContacts
  >

  <div class="postWindow">
    <OpenPostWindow
      options={{
        tags: [],
        kind: 1,
      }}
    />
  </div>
{/if}
