<script lang="ts">
  import { createRxForwardReq, createTie } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Metadata from "../../lib/components/NostrMainData/Metadata.svelte";
  import SetRepoReactions from "../../lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "../../lib/components/NostrMainData/TimelineList.svelte";

  import NostrMain from "../../lib/components/NostrMainData/NostrMain.svelte";
  import { app, queryClient, tieMapStore } from "$lib/stores/stores";
  import SetSearchRelays from "../../lib/components/NostrMainData/SetSearchRelays.svelte";
  import { toRelaySet } from "$lib/stores/useRelaySet";

  import { nip50relays } from "$lib/func/util";
  import EventCard from "../../lib/components/NostrElements/Note/EventCard.svelte";
  import { generateRandomId, setTieKey } from "$lib/func/nostr";
  import { afterNavigate } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  export let filter: Nostr.Filter;

  let amount = 50;
  let viewIndex = 0;

  $: console.log(filter);
  const tieKey = "search";

  onMount(() => {
    setTieKey(tieKey);
  });
  afterNavigate(() => {
    setTieKey(tieKey);
  });
  onDestroy(() => {
    // $queryClient.cancelQueries({
    //   queryKey: ["search"],
    // });
    // $queryClient.removeQueries({ queryKey: ["search"] });
    //console.log("cancelQueries");
  });
</script>

<section>
  <NostrMain let:pubkey let:localRelays>
    <!-- <SetSearchRelays
      defaultRelays={localRelays.length > 0
        ? localRelays
        : toRelaySet($queryClient.getQueryData(["defaultRelay", pubkey]))}
      setRelayList={nip50relays}
      let:searchRelays
    > -->
    <SetDefaultRelays {pubkey} {localRelays}>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <div class="w-full break-words overflow-x-hidden max-w-full">
        <TimelineList
          queryKey={["search", generateRandomId(4)]}
          filters={[filter]}
          req={createRxForwardReq()}
          let:events
          {viewIndex}
          {amount}
          let:len
          {tieKey}
          relays={nip50relays}
        >
          <SetRepoReactions />
          <div slot="loading">loading</div>

          <div slot="error" let:error>
            {error}
          </div>
          <div slot="nodata">nodata</div>
          <div class=" break-words">
            {#if events && events.length > 0}
              {#each events as event, index (event.id)}
                <div
                  class="break-words whitespace-pre-line m-1 overflow-hidden {index ===
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
        </TimelineList>
      </div>
    </SetDefaultRelays>
  </NostrMain>
</section>
