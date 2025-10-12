<script lang="ts">
  import { afterNavigate, goto } from "$app/navigation";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  //import { setRelays } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";

  import { onMount } from "svelte";
  import AllReactions from "$lib/components/renderSnippets/nostr/reaction/AllReactions.svelte";
  import NoteRepostList from "$lib/components/NostrElements/AllReactionsElement/NoteRepostList.svelte";
  import NoteReactionList from "$lib/components/NostrElements/AllReactionsElement/NoteReactionList.svelte";
  import ZapReactionList from "$lib/components/NostrElements/AllReactionsElement/ZapReactionList.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import { sortEvents } from "$lib/func/util";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import NoteInfo from "$lib/components/NostrElements/kindEvents/NoteInfo.svelte";
  import { page } from "$app/state";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const atag = `${data.kind}:${data.pubkey}:${data.identifier}`;
  const filters: Nostr.Filter[] = [
    { "#d": [data.identifier], kinds: [data.kind], authors: [data.pubkey] },
  ];

  let loading = $state(true);

  let isOnMount = false;

  const maxHeight = 0;
  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });
  afterNavigate((navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });

  async function init() {
    if (data.kind === 30000) {
      goto(`list/${page.params.naddr}`);
    }

    loading = false;
  }
</script>

{#if loading}
  loading
{:else if Object.entries($defaultRelays).length > 0}
  <section class="container">
    <LatestEvent queryKey={["naddr", atag]} {filters}>
      {#snippet loading()}
        <div>loading</div>
      {/snippet}
      {#snippet error()}
        <div>error</div>
      {/snippet}
      {#snippet nodata()}
        <div>nodata</div>
      {/snippet}

      {#snippet success({ event })}
        <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
          {#snippet loading()}
            <div
              class=" w-full ivide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
            >
              <EventCard
                note={event}
                depth={0}
                repostable={true}
                {maxHeight}
              /><NoteInfo note={event} />
            </div>
          {/snippet}
          {#snippet nodata()}
            <div
              class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
            >
              <EventCard
                note={event}
                depth={0}
                repostable={true}
                {maxHeight}
              /><NoteInfo note={event} />
            </div>
          {/snippet}
          {#snippet error()}
            <div
              class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
            >
              <EventCard
                note={event}
                depth={0}
                repostable={true}
                {maxHeight}
              /><NoteInfo note={event} />
            </div>
          {/snippet}
          {#snippet content({ metadata })}
            <div
              class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
            >
              <EventCard
                {metadata}
                note={event}
                depth={0}
                repostable={true}
                {maxHeight}
              /><NoteInfo note={event} />
            </div>
          {/snippet}
        </Metadata>

        <AllReactions {atag}>
          {#snippet loading()}
            <div>loading</div>
          {/snippet}
          {#snippet nodata()}
            <div>nodata</div>
          {/snippet}
          {#snippet error()}
            <div>error</div>
          {/snippet}

          {#snippet children({ kind1, kind6, kind7, kind9735, status })}
            <!--kind6-->
            <NoteRepostList events={kind6} {status} />

            <!--kind7-->
            <NoteReactionList events={kind7} {status} />

            <!--zap レシート-->
            <ZapReactionList events={kind9735} {status} />

            <!--kind1,42-->
            <CollapsibleList title="Comments" amount={kind1.length} {status}>
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
                  >
                    {#snippet loading()}
                      <div>
                        <EventCard note={event} depth={0} repostable={true} />
                      </div>
                    {/snippet}
                    {#snippet nodata()}
                      <div>
                        <EventCard note={event} depth={0} repostable={true} />
                      </div>
                    {/snippet}
                    {#snippet error()}
                      <div>
                        <EventCard
                          note={event}
                          depth={0}
                          repostable={true}
                          {maxHeight}
                        />
                      </div>
                    {/snippet}
                    {#snippet content({ metadata })}
                      <EventCard
                        {metadata}
                        note={event}
                        depth={0}
                        repostable={true}
                      />
                    {/snippet}
                  </Metadata>
                  <!-- </div> -->
                {/each}
              </div>
            </CollapsibleList>
          {/snippet}
        </AllReactions>
      {/snippet}
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
