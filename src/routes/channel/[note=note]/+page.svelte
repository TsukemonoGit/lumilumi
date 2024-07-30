<script lang="ts">
  import {
    createRxForwardReq,
    createTie,
    now,
    tie,
    type EventPacket,
  } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { setRelays, setTieKey } from "$lib/func/nostr";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/Note/ChannelMetadata.svelte";
  import { defaultRelays, queryClient } from "$lib/stores/stores";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { type QueryKey } from "@tanstack/svelte-query";
  import { nip19 } from "nostr-tools";

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };

  let amount = 50;
  let viewIndex = 0;
  const tieKey = "note";

  let isOnMount = false;
  let since: number | undefined = undefined;
  const timelineQuery: QueryKey = ["channel", "feed", data.id];
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
    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
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
  <title>Lumilumi-Channel</title>
  <meta property="og:description" content="Channel" />
  <meta name="description" content="Channel" />
</svelte:head>
<section>
  <div class="w-full break-words overflow-hidden">
    <ChannelMetadata
      id={data.id}
      linkButtonTitle={`/channel/${nip19.noteEncode(data.id)}`}
    />{#if since}
      <TimelineList
        queryKey={timelineQuery}
        filters={[
          {
            "#e": [data.id],
            kinds: [42],
            limit: 50,
            since: since,
          },
        ]}
        req={createRxForwardReq()}
        let:events
        {viewIndex}
        {amount}
        {tieKey}
        lastfavcheck={false}
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
          class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/25"
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
      </TimelineList>{/if}
  </div>
</section>

<div class="postWindow">
  <OpenPostWindow options={{ tags: [["e", data.id, "", "root"]], kind: 42 }} />
</div>
