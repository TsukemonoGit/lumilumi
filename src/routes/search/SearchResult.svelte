<script lang="ts">
  import { createRxForwardReq, createTie } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Metadata from "../../lib/components/NostrMainData/Metadata.svelte";
  import SetRepoReactions from "../../lib/components/NostrMainData/SetRepoReactions.svelte";

  import { nip50relays } from "$lib/func/util";
  import EventCard from "../../lib/components/NostrElements/Note/EventCard.svelte";
  import { generateRandomId, setTieKey } from "$lib/func/nostr";
  import { afterNavigate } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import SearchResultList from "./SearchResultList.svelte";
  export let filters: Nostr.Filter[];

  let amount = 50;
  let viewIndex = 0;

  $: console.log(filters);
  // const tieKey = "search";

  onMount(() => {
    setTieKey("undefined");
  });
  afterNavigate(() => {
    setTieKey("undefined");
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
  <div class="w-full break-words overflow-x-hidden max-w-full">
    <!--untilが設定されてたら現在のあれをあれしなくていいことかんがえておいて何日から何日までってできるけど何日までの新しいのから何個分を表示してる感じになってるから何日までの方の設定だけでいいかも後ろのやつは🔻で足せるし-->
    <SearchResultList
      queryKey={["search", generateRandomId(4)]}
      {filters}
      req={createRxForwardReq()}
      let:events
      {viewIndex}
      {amount}
      let:len
      relays={nip50relays}
    >
      <SetRepoReactions />
      <div slot="loading">loading</div>

      <div slot="error" let:error>
        {error}
      </div>
      <div slot="nodata">nodata</div>
      <div class=" break-words divide-y divide-magnum-600/30">
        {#if events && events.length > 0}
          {#each events as event, index (event.id)}
            <div
              class="break-words whitespace-pre-line overflow-hidden {index ===
              events.length - 1
                ? 'last-visible'
                : ''} {index === 0 ? 'first-visible' : ''}"
            >
              <Metadata
                queryKey={["metadata", event.pubkey]}
                pubkey={event.pubkey}
                let:metadata
              >
                <div slot="loading" class="w-full">
                  <EventCard note={event} />
                </div>
                <div slot="nodata" class="w-full">
                  <EventCard note={event} />
                </div>
                <div slot="error" class="w-full">
                  <EventCard note={event} />
                </div>
                <EventCard {metadata} note={event} />
              </Metadata>
            </div>
          {/each}
        {/if}
      </div>
    </SearchResultList>
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
