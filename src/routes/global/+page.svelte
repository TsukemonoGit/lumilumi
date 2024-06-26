<script lang="ts">
  import NostrMain from "$lib/components/NostrMain.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetGlobalRelays from "$lib/components/NostrMainData/SetGlobalRelays.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import EventCard from "$lib/components/Note/EventCard.svelte";
  import { createRxForwardReq } from "rx-nostr";

  let amount = 50;
  let viewIndex = 0;
</script>

<svelte:head>
  <title>Lumilumi-Global</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<section>
  <h1 class="text-5xl text-orange-600">Global</h1>

  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays} let:relays>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <SetGlobalRelays {pubkey} defaultRelays={relays}>
        <div slot="loading">loading</div>
        <div slot="error">error</div>
        <div slot="nodata">nodata</div>

        <div class="container break-words overflow-hidden">
          <TimelineList
            queryKey={["global", "feed"]}
            filters={[
              {
                kinds: [1, 6, 16],
                limit: 50,
              },
            ]}
            req={createRxForwardReq()}
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

            <div class="max-w-[100vw] break-words box-border">
              {#if events && events.length > 0}
                {#each events as event (event.id)}<div
                    class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden"
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
          </TimelineList>
        </div>
      </SetGlobalRelays>
    </SetDefaultRelays>
  </NostrMain>
</section>

<style>
  .svgset {
    display: flex;
    gap: 4px;
  }
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
