<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";

  import { queryClient, tieMapStore } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { createRxForwardReq } from "rx-nostr";
  import { now, type EventPacket } from "rx-nostr/src";
  import { onDestroy, onMount } from "svelte";
  import * as Nostr from "nostr-typedef";
  import { followList, timelineFilter } from "$lib/stores/globalRunes.svelte";

  let isOnMount = false;
  let amount = 50;
  let viewIndex = 0;
  interface Props {
    timelineQuery: QueryKey;
    tieKey?: string;
    globalRelays: any;
  }
  const req = createRxForwardReq("global");
  let { timelineQuery, tieKey = "global", globalRelays }: Props = $props();

  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });
  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });

  let since: number | undefined = $state(undefined);
  async function init() {
    since = undefined;

    const ev: EventPacket[] | undefined = queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);

    if (!ev || ev.length <= 0) {
      since = since = now() - 10 * 60; //10分くらいならもれなく取れることとして初期sinceを15分前に設定することで、初期読込時間を短縮する //now();
    } else {
      since = ev[0].event.created_at;
    }
  }

  // svelte-ignore non_reactive_update
  let resetUniq: () => void;
  onDestroy(() => {
    queryClient.removeQueries({
      queryKey: timelineQuery,
    });
    queryClient.removeQueries({
      queryKey: [...timelineQuery, "olderData"],
    });
    console.log("GlobalTimelineDestroy");
    // Clear tie map data
    const globalTie = $tieMapStore[tieKey];
    if (globalTie) {
      const [, seenOn] = globalTie;
      seenOn.clear();
    }
    resetUniq?.();
  });

  const checkGlobalFolloweePost = (note: Nostr.Event): boolean => {
    if (timelineFilter.get().globalExcludeFollowee) {
      return !followList.get().has(note.pubkey);
    } else {
      return true;
    }
  };
</script>

{#if since && globalRelays.length > 0}
  <TimelineList
    bind:resetUniq
    queryKey={timelineQuery}
    filters={[
      {
        kinds: [1, 6, 16],

        since: since,
      },
    ]}
    olderFilters={[
      {
        kinds: [1, 6, 16],

        since: since,
      },
    ]}
    {req}
    {viewIndex}
    {amount}
    {tieKey}
    relays={globalRelays}
    eventFilter={(note) => {
      return checkGlobalFolloweePost(note);
    }}
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
                  <EventCard note={event} {tieKey} />
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="w-full">
                  <EventCard note={event} {tieKey} />
                </div>
              {/snippet}
              {#snippet error()}
                <div class="w-full">
                  <EventCard note={event} {tieKey} />
                </div>
              {/snippet}
              {#snippet content({ metadata })}
                <EventCard {metadata} note={event} {tieKey} />
              {/snippet}
            </Metadata>
            <!-- </div> -->
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
  </TimelineList>
{/if}
