<script lang="ts">
  import AllReactions from "$lib/components/NostrMainData/AllReactions.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import { defaultRelays } from "$lib/stores/stores";

  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import Note from "$lib/components/NostrElements/Note/Note.svelte";
  import ZapReactionList from "$lib/components/NostrElements/AllReactionsElement/ZapReactionList.svelte";
  import NoteReactionList from "$lib/components/NostrElements/AllReactionsElement/NoteReactionList.svelte";
  import NoteRepostList from "$lib/components/NostrElements/AllReactionsElement/NoteRepostList.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import { setRelays } from "$lib/func/nostr";
  import { afterNavigate } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { sortEvents } from "$lib/func/util";

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };

  let isMount = false;
  onMount(() => {
    init();
  });
  afterNavigate(() => {
    init();
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
</script>

<svelte:head>
  <title>Lumilumi-Note</title>
  <meta property="og:description" content="Note" />
  <meta name="description" content="Note" />
</svelte:head>

<section>
  <SetRepoReactions />
  <div
    class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
  >
    <Note
      id={data.id}
      maxHeight={"none"}
      displayMenu={true}
      thread={true}
      depth={0}
      {repostable}
    />
  </div>
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
    <NoteRepostList events={kind6} />

    <!--kind7-->
    <NoteReactionList events={kind7} />

    <!--zap レシート-->
    <ZapReactionList events={kind9735} />

    <!--kind1-->
    <CollapsibleList title="Kind1" amount={kind1.length}>
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
              <EventCard note={event} depth={0} {repostable} />
            </div>
            <div slot="nodata">
              <EventCard note={event} depth={0} {repostable} />
            </div>
            <div slot="error">
              <EventCard note={event} depth={0} {repostable} />
            </div>
            <EventCard {metadata} note={event} depth={0} {repostable} />
          </Metadata>
          <!-- </div> -->
        {/each}
      </div>
    </CollapsibleList>
  </AllReactions>
</section>
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
