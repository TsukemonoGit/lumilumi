<script lang="ts">
  import { createRxForwardReq, createTie, now, tie } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { pubkeysIn, setRelays, setTieKey } from "$lib/func/nostr";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import Contacts from "$lib/components/NostrMainData/Contacts.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/Note/ChannelMetadata.svelte";
  import { defaultRelays, tieMapStore } from "$lib/stores/stores";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };

  let amount = 50;
  let viewIndex = 0;
  const tieKey = "note";
  onMount(() => {
    setTieKey(tieKey);
    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
  });
  afterNavigate(() => {
    setTieKey(tieKey);
    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
  });
</script>

<section>
  <div class="w-full break-words overflow-hidden">
    <ChannelMetadata id={data.id} />
    <TimelineList
      queryKey={["channel", "feed", data.id]}
      filters={[
        {
          "#e": [data.id],
          kinds: [42],
          limit: 50,
          since: now(),
        },
      ]}
      req={createRxForwardReq()}
      let:events
      {viewIndex}
      {amount}
      {tieKey}
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
          {#each events as event, index (event.id)}
            <div
              class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden event-card {index ===
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
</section>
