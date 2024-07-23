<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { setTieKey } from "$lib/func/nostr";

  import { onMount } from "svelte";
  import {
    createRxForwardReq,
    latest,
    now,
    uniq,
    type EventPacket,
  } from "rx-nostr";
  import * as Nostr from "nostr-typedef";

  import { _ } from "svelte-i18n";

  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { loginUser, queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";

  export let data: {
    pubkey: string;
  };
  let amount = 50;
  let viewIndex = 0;
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
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<section>
  <div class="w-full break-words overflow-x-hidden">
    {#if since}
      <TimelineList
        queryKey={["notifications", "feed"]}
        filters={[
          {
            kinds: [7],
            limit: 30,
            authors: [data.pubkey],
            since: since,
          },
        ]}
        req={createRxForwardReq()}
        let:events
        {viewIndex}
        {amount}
        eventFilter={(eventpacket) => eventpacket.event.pubkey !== $loginUser}
        {tieKey}
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
