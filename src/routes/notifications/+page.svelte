<script lang="ts">
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import {
    createRxForwardReq,
    createTie,
    now,
    type EventPacket,
  } from "rx-nostr";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import { loginUser, queryClient, tieMapStore } from "$lib/stores/stores";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import { afterNavigate } from "$app/navigation";
  import { setTieKey } from "$lib/func/nostr";
  import { onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  let amount = 50;
  let viewIndex = 0;
  // const [tie, tieMap] = createTie();
  // tieMapStore.set(tieMap);
  const tieKey = "notifications";

  let isOnMount = false;
  let since: number | undefined = undefined;
  const timelineQuery: QueryKey = ["notifications", "feed"];
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
</script>

<svelte:head>
  <title>Lumilumi-Notifications</title>
  <meta property="og:description" content="Notifications" />
  <meta name="description" content="Notifications" />
</svelte:head>
<section>
  <div class="w-full break-words overflow-x-hidden">
    {#if since}
      <TimelineList
        queryKey={timelineQuery}
        filters={[
          {
            kinds: [1, 6, 7, 16, 42, 9735],
            limit: 30,
            "#p": [$loginUser],
            since: since,
          },
        ]}
        req={createRxForwardReq()}
        let:events
        {viewIndex}
        {amount}
        eventFilter={(eventpacket) => eventpacket.event.pubkey !== $loginUser}
        {tieKey}
        lastfavcheck={false}
      >
        <div slot="loading">
          <p>Loading...</p>
        </div>

        <div slot="error" let:error>
          <p>{error}</p>
        </div>
        <SetRepoReactions />
        <div class="max-w-[100vw] break-words box-border">
          {#if events && events.length > 0}
            {#each events as event, index (event.id)}<div
                class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden {index ===
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
                  <EventCard {metadata} note={event} /></Metadata
                >
              </div>{/each}{/if}
        </div>
      </TimelineList>{/if}
  </div>
</section>
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
