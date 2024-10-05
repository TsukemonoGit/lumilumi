<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { generateRandomId } from "$lib/func/nostr";
  import { queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { createRxForwardReq } from "rx-nostr";
  import { now, type EventPacket } from "rx-nostr/src";
  import { onDestroy, onMount } from "svelte";

  let isOnMount = false;
  export let timelineQuery: QueryKey;
  let amount = 50;
  let viewIndex = 0;
  const tieKey = "global";
  export let globalRelays;

  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });
  afterNavigate(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });

  let since: number | undefined = undefined;
  async function init() {
    since = undefined;

    const ev: EventPacket[] | undefined = $queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = since = now() - 10 * 60; //10分くらいならもれなく取れることとして初期sinceを15分前に設定することで、初期読込時間を短縮する //now();
    } else {
      since = ev[0].event.created_at;
    }
  }
</script>

{#if since}
  <TimelineList
    queryKey={timelineQuery}
    filters={[
      {
        kinds: [1, 6, 16],
        limit: 50,
        since: since,
      },
    ]}
    req={createRxForwardReq()}
    let:events
    {viewIndex}
    {amount}
    let:len
    {tieKey}
    relays={globalRelays}
  >
    <!-- <SetRepoReactions /> -->
    <div slot="loading">
      <p>Loading...</p>
    </div>

    <div slot="error" let:error>
      <p>{error}</p>
    </div>

    <div
      class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
    >
      {#if events && events.length > 0}
        {#each events as event, index (event.id)}
          <!-- <div
        class="max-w-full break-words whitespace-pre-line box-border overflow-hidden {index ===
        events.length - 1
          ? 'last-visible'
          : ''} {index === 0 ? 'first-visible' : ''}"
      > -->
          <Metadata
            queryKey={["metadata", event.pubkey]}
            pubkey={event.pubkey}
            let:metadata
          >
            <div slot="loading" class="w-full">
              <EventCard note={event} {tieKey} />
            </div>
            <div slot="nodata" class="w-full">
              <EventCard note={event} {tieKey} />
            </div>
            <div slot="error" class="w-full">
              <EventCard note={event} {tieKey} />
            </div>
            <EventCard {metadata} note={event} {tieKey} /></Metadata
          >
          <!-- </div> -->
        {/each}{/if}
    </div>
  </TimelineList>
{/if}
