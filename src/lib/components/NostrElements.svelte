<script lang="ts">
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Contacts from "./NostrMainData/Contacts.svelte";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import { pubkeysIn, setTieKey } from "$lib/func/nostr";
  import SetRepoReactions from "./NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "./NostrMainData/TimelineList.svelte";
  import EventCard from "./NostrElements/Note/EventCard.svelte";
  import {
    loginUser,
    queryClient,
    showReactioninTL,
    showUserStatus,
  } from "$lib/stores/stores";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "./OpenPostWindow.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";

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
      since = now();
    } else {
      since = ev[0].event.created_at;
    }
  }

  const makeFilters = (contacts: Nostr.Event<number>): Nostr.Filter[] => {
    console.log(contacts);
    const pubkeyList = pubkeysIn(contacts, $loginUser);
    const filters: Nostr.Filter[] = [
      {
        authors: pubkeyList,
        kinds: [1, 6, 16],
        limit: 50,
        since: since,
      },
    ];

    if ($showReactioninTL) {
      filters.push({
        kinds: [
          1 /*リプライ*/, 6 /*kind1のリポスト*/,
          /*16,kind1以外のリポスト（ktag）*/ 7 /*リアクション kタグ*/,
          9735 /*zap receipt**/,
        ],
        "#p": [$loginUser],
        limit: 5,
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
</script>

<div class="w-full break-words overflow-hidden">
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
        let:len
      >
        <SetRepoReactions />
        <div slot="loading">
          <p>Loading...</p>
        </div>

        <div slot="error" let:error>
          <p>{error}</p>
        </div>

        <div
          class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30"
        >
          {#if events && events.length > 0}
            {#each events as event, index (event.id)}
              <div
                class="max-w-full break-words whitespace-pre-line box-border overflow-hidden event-card {index ===
                events.length - 1
                  ? 'last-visible'
                  : ''} {index === 0 ? 'first-visible' : ''}"
              >
                <Metadata
                  queryKey={["metadata", event.pubkey]}
                  pubkey={event.pubkey}
                  let:metadata
                >
                  <div slot="loading">
                    <EventCard note={event} status="loading" />
                  </div>
                  <div slot="nodata">
                    <EventCard note={event} status="nodata" />
                  </div>
                  <div slot="error">
                    <EventCard note={event} status="error" />
                  </div>
                  <EventCard {metadata} note={event} />
                </Metadata>
              </div>
            {/each}
          {/if}
        </div>
      </TimelineList>
    {/if}
  </Contacts>
</div>
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
