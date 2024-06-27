<script lang="ts">
  import { createRxForwardReq } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import EventCard from "./Note/EventCard.svelte";
  import SetRepoReactions from "./NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "./NostrMainData/TimelineList.svelte";
  import { onDestroy } from "svelte";

  import NostrMain from "./NostrMain.svelte";
  import { queryClient } from "$lib/stores/stores";
  import SetDefaultRelays from "./NostrMainData/SetDefaultRelays.svelte";
  import SetSearchRelays from "./NostrMainData/SetSearchRelays.svelte";
  export let filter: Nostr.Filter;

  let amount = 50;
  let viewIndex = 0;

  onDestroy(() => {
    //  でりーとしてもreqが残ってるかんじある？
    console.log("Destoroyed");
    // //でりーとするときにけしておく
    // $queryClient.removeQueries({
    //   queryKey: ["search", "feed", filter.toString()],
    // });
  });
</script>

<section>
  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
      <div slot="loading">SetRelay loading</div>
      <div slot="error">SetRelay error</div>
      <div slot="nodata">SetRelay nodata</div>
      <SetSearchRelays defaultRelays={relays} let:searchRelays>
        <div class="container break-words overflow-x-hidden">
          <TimelineList
            queryKey={["search", "feed", filter.toString()]}
            filters={[filter]}
            req={createRxForwardReq()}
            let:events
            {viewIndex}
            {amount}
            let:len
          >
            <SetRepoReactions />
            <div slot="loading">
              <p>Timeline Loading...</p>
            </div>

            <div slot="error" let:error>
              <p>{error}</p>
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
    </SetDefaultRelays>
  </NostrMain>
</section>
