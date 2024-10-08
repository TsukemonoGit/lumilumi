<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import ListLinkCard from "$lib/components/NostrElements/Note/ListLinkCard.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import ListUsersCard from "$lib/components/NostrMainData/ListUsersCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { setRelays } from "$lib/func/nostr";
  import { defaultRelays, loginUser, queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";
  import * as Nostr from "nostr-typedef";

  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import { onMount } from "svelte";

  export let data: {
    identifier: string;
    pubkey: string;
    kind: number;
    relays?: string[] | undefined;
  };
  const atag = `${data.kind}:${data.pubkey}${data.identifier}`;
  const filters: Nostr.Filter[] = [
    { "#d": [data.identifier], kinds: [data.kind], authors: [data.pubkey] },
  ];
  console.log(filters);
  let amount = 50;
  let viewIndex = 0;
  const tieKey = "naddr";
  let loading = true;

  let isOnMount = false;
  let since: number | undefined = undefined;
  const timelineQuery: QueryKey = ["list", "feed", atag];
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

    if ($defaultRelays) {
      setRelays($defaultRelays);
    } else if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
    const ev: EventPacket[] | undefined = $queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now() - 15 * 60; //15分くらいならもれなく取れることとして初期sinceを15分前に設定することで、初期読込時間を短縮する;;;
    } else {
      since = ev[0].event.created_at;
    }
    loading = false;
  }

  const pubkeyList = async (event: Nostr.Event): Promise<string[]> => {
    const pubList = event.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);

    if (event.content.length <= 0) {
      return pubList;
    }
    try {
      const prvListStr = await (
        window.nostr as Nostr.Nip07.Nostr
      ).nip04?.decrypt(
        $loginUser ??
          (await (window.nostr as Nostr.Nip07.Nostr).getPublicKey()),
        event.content
      );
      if (prvListStr) {
        const prvList: string[][] = JSON.parse(prvListStr);
        if (prvList.length > 0) {
          const prv = prvList
            .filter((tag) => tag[0] === "p")
            .map((tag) => tag[1]);
          return Array.from(new Set([...pubList, ...prv]));
        } else {
          return pubList;
        }
      } else {
        return pubList;
      }
    } catch (error) {
      return pubList;
    }
  };
</script>

<svelte:head>
  <title>Lumilumi-List</title>
  <meta property="og:description" content="List" />
  <meta name="description" content="List" />
</svelte:head>
{#if loading}
  loading
{:else}
  <section class="container w-full break-words overflow-hidden">
    <LatestEvent queryKey={["naddr", atag]} {filters} let:event>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <div class="w-full flex justify-between">
        <ListLinkCard {event} depth={0} {tieKey} />
      </div>

      {#await pubkeyList(event)}
        waiting decrypt list
      {:then pubkeys}
        <ListUsersCard {pubkeys} />

        {#if since}
          <TimelineList
            queryKey={timelineQuery}
            filters={[
              {
                kinds: [1, 6, 16],
                authors: pubkeys,
                since: since,
              },
            ]}
            req={createRxForwardReq()}
            let:events
            {viewIndex}
            {amount}
            let:len
            {tieKey}
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
          </TimelineList>{/if}
      {/await}</LatestEvent
    >
  </section>
  <div class="postWindow">
    <OpenPostWindow
      options={{
        tags: [],
        kind: 1,
      }}
    />
  </div>
{/if}
