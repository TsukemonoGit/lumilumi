<script lang="ts">
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import AllReactions from "$lib/components/NostrMainData/AllReactions.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetSearchRelays from "$lib/components/NostrMainData/SetSearchRelays.svelte";

  import { defaultRelays, queryClient } from "$lib/stores/stores";
  import { toRelaySet } from "$lib/stores/useRelaySet";

  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import Note from "$lib/components/NostrElements/Note/Note.svelte";
  import ZapReactionList from "$lib/components/NostrElements/AllReactionsElement/ZapReactionList.svelte";
  import NoteReactionList from "$lib/components/NostrElements/AllReactionsElement/NoteReactionList.svelte";
  import NoteRepostList from "$lib/components/NostrElements/AllReactionsElement/NoteRepostList.svelte";
  import Collapsible from "$lib/components/Elements/Collapsible.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import { setRelays } from "$lib/func/nostr";
  import { afterNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };
  onMount(() => {
    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
  });
  afterNavigate(() => {
    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
  });
</script>

<section>
  <SetRepoReactions />
  <div class="w-full break-words overflow-hidden">
    <div>
      <Note id={data.id} maxHeight={"none"} displayMenu={true} />
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
        {#each kind1 as event (event.id)}
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
      </CollapsibleList>
    </AllReactions>
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
