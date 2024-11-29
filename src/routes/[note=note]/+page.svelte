<script lang="ts">
  import AllReactions from "$lib/components/NostrMainData/AllReactions.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import { defaultRelays } from "$lib/stores/stores";

  import EventCard from "$lib/components/NostrElements/Note/EventCard/EventCard.svelte";

  import ZapReactionList from "$lib/components/NostrElements/AllReactionsElement/ZapReactionList.svelte";
  import NoteReactionList from "$lib/components/NostrElements/AllReactionsElement/NoteReactionList.svelte";
  import NoteRepostList from "$lib/components/NostrElements/AllReactionsElement/NoteRepostList.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import { setRelays } from "$lib/func/nostr";
  import { afterNavigate, goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { sortEvents } from "$lib/func/util";

  import Text from "$lib/components/NostrMainData/Text.svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import NoteInfo from "$lib/components/NostrElements/Note/NoteInfo.svelte";
  import { type PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let tieKey = $derived(data.id);
  let isMount = false;
  onMount(() => {
    init();
  });
  afterNavigate((navigate) => {
    console.log("afterNavigate", navigate.type);
    if (navigate.type !== "form") {
      init();
    }
  });

  function init() {
    if (isMount) {
      return;
    }
    isMount = true;
    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }

    isMount = false;
  }
  onDestroy(() => {
    console.log("destroy");
  });
  const repostable = true;

  const maxHeight = "none";
  const displayMenu = true;
  const thread = true;
  const depth = 0;

  const checkNoteKind = (ev: Nostr.Event) => {
    if (ev.kind === 40) {
      goto(`/channel/${nip19.noteEncode(ev.id)}`);
    }
  };
</script>

<section class="mb-20">
  <!-- <SetRepoReactions /> -->
  <div class="max-w-[100vw] break-words box-border w-full">
    <Text queryKey={["timeline", data.id]} id={data.id}>
      {#snippet loading()}
        <div class=" w-full text-sm text-neutral-500 flex-inline break-all">
          Loading {nip19.noteEncode(data.id)}
        </div>
      {/snippet}
      {#snippet nodata()}
        <div class="text-sm text-neutral-500 flex-inline break-all">
          nodata {nip19.noteEncode(data.id)}
        </div>
      {/snippet}
      {#snippet error()}
        <div class=" w-full text-sm text-neutral-500 flex-inline break-all">
          {nip19.noteEncode(data.id)}
        </div>
      {/snippet}
      {#snippet content({ data: text, status })}
        {#await checkNoteKind(text) then}
          <Metadata queryKey={["metadata", text.pubkey]} pubkey={text.pubkey}>
            {#snippet loading()}
              <div
                class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
              >
                <EventCard
                  note={text}
                  {maxHeight}
                  {thread}
                  {depth}
                  {repostable}
                  {tieKey}
                /><NoteInfo note={text} />
              </div>
            {/snippet}
            {#snippet nodata()}
              <div
                class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
              >
                <EventCard
                  note={text}
                  {maxHeight}
                  {thread}
                  {depth}
                  {repostable}
                  {tieKey}
                /><NoteInfo note={text} />
              </div>
            {/snippet}
            {#snippet error()}
              <div
                class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
              >
                <EventCard
                  note={text}
                  {maxHeight}
                  {thread}
                  {depth}
                  {repostable}
                  {tieKey}
                /><NoteInfo note={text} />
              </div>
            {/snippet}
            {#snippet content({ metadata })}
              <div
                class="divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
              >
                <EventCard
                  note={text}
                  {metadata}
                  {maxHeight}
                  {thread}
                  {displayMenu}
                  {depth}
                  {repostable}
                  {tieKey}
                /><NoteInfo note={text} />
              </div>
            {/snippet}
          </Metadata>

          <!--noteのkindが40の場合はチャンネルページに飛ばすのでノート詠み込まれたあとでAllReactions取得するようにする-->
          <div>
            <AllReactions queryKey={["allreactions", data.id]} id={data.id}>
              {#snippet loading()}
                <div>loading</div>
              {/snippet}
              {#snippet nodata()}
                <div>nodata</div>
              {/snippet}
              {#snippet error()}
                <div>{error}</div>
              {/snippet}

              {#snippet children({ kind1, kind6, kind7, kind9735 })}
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
                      >
                        {#snippet loading()}
                          <div>
                            <EventCard
                              note={event}
                              depth={0}
                              {repostable}
                              {tieKey}
                            />
                          </div>
                        {/snippet}
                        {#snippet nodata()}
                          <div>
                            <EventCard
                              note={event}
                              depth={0}
                              {repostable}
                              {tieKey}
                            />
                          </div>
                        {/snippet}
                        {#snippet error()}
                          <div>
                            <EventCard
                              note={event}
                              depth={0}
                              {repostable}
                              {tieKey}
                            />
                          </div>
                        {/snippet}
                        {#snippet content({ metadata })}
                          <EventCard
                            {metadata}
                            note={event}
                            depth={0}
                            {repostable}
                            {tieKey}
                          />
                        {/snippet}
                      </Metadata>
                      <!-- </div> -->
                    {/each}
                  </div>
                </CollapsibleList>
              {/snippet}
            </AllReactions>
          </div>
        {/await}
      {/snippet}
    </Text>
  </div>
</section>
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
