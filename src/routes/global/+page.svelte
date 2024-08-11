<script lang="ts">
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetGlobalRelays from "$lib/components/NostrMainData/SetGlobalRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import { loginUser, queryClient, toastSettings } from "$lib/stores/stores";
  import { afterNavigate } from "$app/navigation";
  import { setTieKey } from "$lib/func/nostr";
  import { onMount } from "svelte";

  import { _ } from "svelte-i18n";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import Settei from "./Settei.svelte";

  let amount = 50;
  let viewIndex = 0;
  const tieKey = "global";
  let isOnMount = false;
  let since: number | undefined = undefined;
  const timelineQuery: QueryKey = ["global", "feed"];
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
  //let isView = true;
  //let compRef: TimelineList;
  const handleReload = () => {
    // compRef.$destroy();
    // isView = false;
    // $queryClient.refetchQueries({
    //   queryKey: ["globalRelay", $loginUser],
    // });

    $toastSettings = {
      title: "info",
      description: "reload to set new relay list",
      color: "bg-green-500",
    };
    setTimeout(() => {
      location.reload();
    }, 1000);
  };
</script>

<svelte:head>
  <title>Lumilumi-Global</title>
  <meta property="og:description" content="Global" />
  <meta name="description" content="Global" />
</svelte:head>

<section class="w-full break-words overflow-hidden">
  <SetGlobalRelays pubkey={$loginUser} let:relays>
    <div slot="loading" class="w-full">
      <Settei relays={[]} {handleReload} />
    </div>
    <div slot="error" class="w-full">
      <Settei relays={[]} {handleReload} />
    </div>
    <div slot="nodata" class="w-full">
      <Settei relays={[]} {handleReload} />
    </div>
    <Settei {relays} {handleReload} />

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
        {relays}
      >
        <SetRepoReactions />
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
                  <EventCard note={event} />
                </div>
                <div slot="nodata" class="w-full">
                  <EventCard note={event} />
                </div>
                <div slot="error" class="w-full">
                  <EventCard note={event} />
                </div>
                <EventCard {metadata} note={event} /></Metadata
              >
              <!-- </div> -->
            {/each}{/if}
        </div>
      </TimelineList>{/if}
  </SetGlobalRelays>
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
