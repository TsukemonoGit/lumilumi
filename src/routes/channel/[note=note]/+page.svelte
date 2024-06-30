<script lang="ts">
  import { createRxForwardReq } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { pubkeysIn } from "$lib/func/nostr";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import Contacts from "$lib/components/NostrMainData/Contacts.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/Note/ChannelMetadata.svelte";

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };

  let amount = 50;
  let viewIndex = 0;
</script>

<section>
  <NostrMain
    options={{ tags: [["e", data.id, "", "root"]], kind: 42 }}
    let:pubkey
    let:localRelays
  >
    <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>

      <div class="container break-words overflow-hidden">
        <ChannelMetadata id={data.id} />
        <TimelineList
          queryKey={["channel", "feed", data.id]}
          filters={[
            {
              "#e": [data.id],
              kinds: [42],
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
    </SetDefaultRelays>
  </NostrMain>
</section>
