<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { setRelays } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";

  import { onMount } from "svelte";
  import AllReactions from "$lib/components/NostrMainData/AllReactions.svelte";
  import NoteRepostList from "$lib/components/NostrElements/AllReactionsElement/NoteRepostList.svelte";
  import NoteReactionList from "$lib/components/NostrElements/AllReactionsElement/NoteReactionList.svelte";
  import ZapReactionList from "$lib/components/NostrElements/AllReactionsElement/ZapReactionList.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import { sortEvents } from "$lib/func/util";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import NoteInfo from "$lib/components/NostrElements/Note/NoteInfo.svelte";

  export let data: {
    identifier: string;
    pubkey: string;
    kind: number;
    relays?: string[] | undefined;
  };
  const atag = `${data.kind}:${data.pubkey}:${data.identifier}`;
  const filters: Nostr.Filter[] = [
    { "#d": [data.identifier], kinds: [data.kind], authors: [data.pubkey] },
  ];
  //console.log(filters);
  //let amount = 50;
  //let viewIndex = 0;
  const tieKey = "naddr";
  let loading = true;

  let isOnMount = false;
  let since: number | undefined = undefined;
  const maxHeight = "none";
  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });
  afterNavigate((navigate) => {
    console.log("afterNavigate", navigate.type);
    if (!isOnMount) {
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

    loading = false;
  }
</script>

{#if loading}
  loading
{:else}
  <section class="container">
    <LatestEvent queryKey={["naddr", atag]} {filters} let:event>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>

      <Metadata
        queryKey={["metadata", event.pubkey]}
        pubkey={event.pubkey}
        let:metadata
      >
        <div
          slot="loading"
          class=" w-full ivide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard
            note={event}
            depth={0}
            repostable={true}
            {maxHeight}
            {tieKey}
          /><NoteInfo note={event} />
        </div>
        <div
          slot="nodata"
          class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard
            note={event}
            depth={0}
            repostable={true}
            {maxHeight}
            {tieKey}
          /><NoteInfo note={event} />
        </div>
        <div
          slot="error"
          class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard
            note={event}
            depth={0}
            repostable={true}
            {maxHeight}
            {tieKey}
          /><NoteInfo note={event} />
        </div>
        <div
          class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard
            {metadata}
            note={event}
            depth={0}
            repostable={true}
            {maxHeight}
            {tieKey}
          /><NoteInfo note={event} />
        </div>
      </Metadata>

      <!-- <Metadata
        queryKey={["metadata", event.pubkey]}
        pubkey={event.pubkey}
        let:metadata
      >
        <div slot="loading" class="w-full">
          <EventCardNaddr note={event} repostable={true} />
        </div>
        <div slot="nodata" class="w-full">
          <EventCardNaddr note={event} repostable={true} />
        </div>
        <div slot="error" class="w-full">
          <EventCardNaddr note={event} repostable={true} />
        </div>
        <EventCardNaddr {metadata} note={event} repostable={true} />
      </Metadata> -->

      <AllReactions
        queryKey={["allreactions", atag]}
        {atag}
        let:kind1
        let:kind6
        let:kind7
        let:kind9735
      >
        <div slot="loading">loading</div>
        <div slot="nodata">nodata</div>
        <div slot="error">error</div>

        <!--kind6-->
        <NoteRepostList events={kind6} {tieKey} />

        <!--kind7-->
        <NoteReactionList events={kind7} {tieKey} />

        <!--zap レシート-->
        <ZapReactionList events={kind9735} {tieKey} />

        <!--kind1,42-->
        <CollapsibleList title="Kind1,42" amount={kind1.length}>
          <div
            class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
          >
            {#each sortEvents(kind1).reverse() as event (event.id)}
              <!-- <div
          class="max-w-full break-words whitespace-pre-line box-border overflow-hidden event-card"
        > -->
              <Metadata
                queryKey={["metadata", event.pubkey]}
                pubkey={event.pubkey}
                let:metadata
              >
                <div slot="loading">
                  <EventCard
                    note={event}
                    depth={0}
                    repostable={true}
                    {tieKey}
                  />
                </div>
                <div slot="nodata">
                  <EventCard
                    note={event}
                    depth={0}
                    repostable={true}
                    {tieKey}
                  />
                </div>
                <div slot="error">
                  <EventCard
                    note={event}
                    depth={0}
                    repostable={true}
                    {maxHeight}
                    {tieKey}
                  />
                </div>
                <EventCard
                  {metadata}
                  note={event}
                  depth={0}
                  repostable={true}
                  {tieKey}
                />
              </Metadata>
              <!-- </div> -->
            {/each}
          </div>
        </CollapsibleList>
      </AllReactions>
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
