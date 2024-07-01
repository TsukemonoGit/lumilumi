<script lang="ts">
  import { createRxForwardReq, createTie } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Metadata from "../../lib/components/NostrMainData/Metadata.svelte";
  import SetRepoReactions from "../../lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "../../lib/components/NostrMainData/TimelineList.svelte";

  import NostrMain from "../../lib/components/NostrMainData/NostrMain.svelte";
  import { queryClient, tieMapStore } from "$lib/stores/stores";
  import SetSearchRelays from "../../lib/components/NostrMainData/SetSearchRelays.svelte";
  import { toRelaySet } from "$lib/stores/useRelaySet";

  import { nip50relays } from "$lib/func/util";
  import EventCard from "../../lib/components/NostrElements/Note/EventCard.svelte";
  export let filter: Nostr.Filter;

  let amount = 50;
  let viewIndex = 0;

  $: console.log(filter);
  const [tie, tieMap] = createTie();
  tieMapStore.set(tieMap);
</script>

<section>
  <NostrMain let:pubkey let:localRelays>
    <SetSearchRelays
      defaultRelays={localRelays.length > 0
        ? localRelays
        : toRelaySet($queryClient.getQueryData(["defaultRelay", pubkey]))}
      setRelayList={nip50relays}
      let:searchRelays
    >
      <div class="container break-words overflow-x-hidden">
        <TimelineList
          queryKey={["search", "feed", JSON.stringify(filter)]}
          filters={[filter]}
          req={createRxForwardReq()}
          let:events
          {viewIndex}
          {amount}
          let:len
          {tie}
        >
          <SetRepoReactions />
          <div slot="loading">
            <p>{JSON.stringify(filter)} loading</p>
          </div>

          <div slot="error" let:error>
            <p>{JSON.stringify(filter)} {error}</p>
          </div>

          <div class="max-w-[100vw] break-words box-border">
            {#if events && events.length > 0}
              {#each events as event (event.id)}
                <div
                  class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden event-card"
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
        </TimelineList>
      </div>
    </SetSearchRelays>
  </NostrMain>
</section>
