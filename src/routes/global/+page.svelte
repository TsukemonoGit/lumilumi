<script lang="ts">
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetGlobalRelays from "$lib/components/NostrMainData/SetGlobalRelays.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, createTie } from "rx-nostr";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import { tieMapStore } from "$lib/stores/stores";

  let amount = 50;
  let viewIndex = 0;
  const [tie, tieMap] = createTie();
  tieMapStore.set(tieMap);
</script>

<svelte:head>
  <title>Lumilumi-Global</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<section>
  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays} let:relays>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <SetGlobalRelays {pubkey} defaultRelays={relays}>
        <div slot="loading">loading</div>
        <div slot="error">error</div>
        <div slot="nodata">nodata</div>

        <div class="w-full break-words overflow-hidden">
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
            {tie}
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
                {#each events as event, index (event.id)}<div
                    class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden {index ===
                    events.length - 2
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
          </TimelineList>
        </div>
      </SetGlobalRelays>
    </SetDefaultRelays>
  </NostrMain>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
