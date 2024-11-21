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

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };

  $: tieKey = data.id;
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
    <Text queryKey={["timeline", data.id]} id={data.id} let:text let:status>
      <div
        slot="loading"
        class=" w-full text-sm text-neutral-500 flex-inline break-all"
      >
        Loading {nip19.noteEncode(data.id)}
      </div>
      <div slot="nodata" class="text-sm text-neutral-500 flex-inline break-all">
        {#if data.relays && data.relays.length > 0}
          <Text
            queryKey={["timeline", data.id]}
            relays={data.relays}
            id={data.id}
            let:text
            let:status
          >
            <div
              slot="loading"
              class=" w-full text-sm text-neutral-500 flex-inline break-all"
            >
              Loading {nip19.noteEncode(data.id)}
            </div>
            <div
              slot="nodata"
              class="text-sm text-neutral-500 flex-inline break-all"
            >
              Nodata {nip19.noteEncode(data.id)}
            </div>
            <div
              slot="error"
              let:error
              class=" w-full text-sm text-neutral-500 flex-inline break-all"
            >
              {nip19.noteEncode(data.id)}
            </div>
            {#await checkNoteKind(text) then}
              <Metadata
                queryKey={["metadata", text.pubkey]}
                pubkey={text.pubkey}
                let:metadata
              >
                <div
                  slot="loading"
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
                <div
                  slot="nodata"
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
                <div
                  slot="error"
                  class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
                  let:error
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
              </Metadata>

              <!--noteのkindが40の場合はチャンネルページに飛ばすのでノート詠み込まれたあとでAllReactions取得するようにする-->
              <div>
                <AllReactions
                  queryKey={["allreactions", data.id]}
                  id={data.id}
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
                              {repostable}
                              {tieKey}
                            />
                          </div>
                          <div slot="nodata">
                            <EventCard
                              note={event}
                              depth={0}
                              {repostable}
                              {tieKey}
                            />
                          </div>
                          <div slot="error">
                            <EventCard
                              note={event}
                              depth={0}
                              {repostable}
                              {tieKey}
                            />
                          </div>
                          <EventCard
                            {metadata}
                            note={event}
                            depth={0}
                            {repostable}
                            {tieKey}
                          />
                        </Metadata>
                        <!-- </div> -->
                      {/each}
                    </div>
                  </CollapsibleList>
                </AllReactions>
              </div>
            {/await}
          </Text>
        {:else}
          Nodata {nip19.noteEncode(data.id)}{/if}
      </div>
      <div
        slot="error"
        let:error
        class=" w-full text-sm text-neutral-500 flex-inline break-all"
      >
        {nip19.noteEncode(data.id)}
      </div>
      {#await checkNoteKind(text) then}
        <Metadata
          queryKey={["metadata", text.pubkey]}
          pubkey={text.pubkey}
          let:metadata
        >
          <div
            slot="loading"
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
          <div
            slot="nodata"
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
          <div
            slot="error"
            class=" w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
            let:error
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
        </Metadata>

        <!--noteのkindが40の場合はチャンネルページに飛ばすのでノート詠み込まれたあとでAllReactions取得するようにする-->
        <div>
          <AllReactions
            queryKey={["allreactions", data.id]}
            id={data.id}
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
                      <EventCard note={event} depth={0} {repostable} {tieKey} />
                    </div>
                    <div slot="nodata">
                      <EventCard note={event} depth={0} {repostable} {tieKey} />
                    </div>
                    <div slot="error">
                      <EventCard note={event} depth={0} {repostable} {tieKey} />
                    </div>
                    <EventCard
                      {metadata}
                      note={event}
                      depth={0}
                      {repostable}
                      {tieKey}
                    />
                  </Metadata>
                  <!-- </div> -->
                {/each}
              </div>
            </CollapsibleList>
          </AllReactions>
        </div>
      {/await}
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
