<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import ListLinkCard from "$lib/components/NostrElements/kindEvents/EventCard/ListLinkCard.svelte";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import ListUsersCard from "$lib/components/NostrElements/ListUsersCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { setRelays } from "$lib/func/nostr";
  import { defaultRelays, queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";

  import * as Nostr from "nostr-typedef";

  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import { onMount } from "svelte";

  import type { PageData } from "./$types";
  import { loginUser, lumiSetting } from "$lib/stores/globalRunes.svelte";
  let { data }: { data: PageData } = $props();

  const atag = `${data.kind}:${data.pubkey}${data.identifier}`;
  const filters: Nostr.Filter[] = [
    { "#d": [data.identifier], kinds: [data.kind], authors: [data.pubkey] },
  ];
  console.log(filters);
  let amount = 50;
  let viewIndex = 0;

  let loading = $state(true);

  let isOnMount = false;
  let since: number | undefined = $state(undefined);
  const timelineQuery: QueryKey = ["list", "feed", atag];
  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });
  afterNavigate((navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
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
    const ev: EventPacket[] | undefined = queryClient?.getQueryData([
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
        lumiSetting.get().pubkey ??
          loginUser.get() ??
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

{#if loading}
  loading
{:else}
  <section class=" w-full break-words overflow-hidden">
    <LatestEvent queryKey={["naddr", atag]} {filters}>
      {#snippet loading()}
        <div>loading</div>
      {/snippet}
      {#snippet error()}
        <div>error</div>
      {/snippet}
      {#snippet nodata()}
        <div>nodata</div>
      {/snippet}
      {#snippet children({ event })}
        <div class="w-full flex justify-between">
          <ListLinkCard {event} depth={0} />
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
              olderFilters={[
                {
                  kinds: [1, 6, 16],
                  authors: pubkeys,
                  since: since,
                },
              ]}
              req={createRxForwardReq()}
              {viewIndex}
              {amount}
            >
              {#snippet content({ events, len })}
                <!-- <SetRepoReactions /> -->
                <div
                  class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
                >
                  {#if events && events.length > 0}
                    {#each events as event, index (event.id)}
                      <Metadata
                        queryKey={["metadata", event.pubkey]}
                        pubkey={event.pubkey}
                      >
                        {#snippet loading()}
                          <div class="w-full">
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet nodata()}
                          <div class="w-full">
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet error()}
                          <div class="w-full">
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet content({ metadata })}
                          <EventCard {metadata} note={event} />
                        {/snippet}
                      </Metadata>
                    {/each}{/if}
                </div>{/snippet}
              {#snippet loading()}
                <div>
                  <p>Loading...</p>
                </div>
              {/snippet}

              {#snippet error()}
                <div>
                  <p>{error}</p>
                </div>
              {/snippet}
            </TimelineList>{/if}
        {/await}
      {/snippet}
    </LatestEvent>
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
