<script lang="ts">
  import { createRxForwardReq } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Metadata from "../../lib/components/NostrMainData/Metadata.svelte";

  import { nip50relays } from "$lib/func/constants";
  import EventCard from "../../lib/components/NostrElements/Note/EventCard/EventCard.svelte";

  import { onDestroy, onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import SearchResultList from "./SearchResultList.svelte";
  import { defaultRelays, queryClient } from "$lib/stores/stores";

  let amount = 50;
  let viewIndex = 0;
  interface Props {
    filters: Nostr.Filter[];
    relays: string[];
  }

  let { filters, relays }: Props = $props();

  //$: console.log(filters);
  const tieKey = "search";

  // onMount(() => {
  //   console.log("relays", relays);
  // });
  // afterNavigate(() => {
  //   console.log("relays", relays);
  // });
  onDestroy(() => {
    console.log("onDestroy");
    // queryClient.cancelQueries({
    //   queryKey: ["search"],
    // });
    // queryClient.cancelQueries({ queryKey: ["search", "olderData"] });
    queryClient.removeQueries({ queryKey: ["search"] });
    queryClient.removeQueries({ queryKey: ["search", "olderData"] });
    //console.log("cancelQueries");
  });
</script>

{#if filters && Object.values($defaultRelays).length > 0}
  <div class="w-full break-words overflow-x-hidden max-w-full">
    <!--untilが設定されてたら現在のあれをあれしなくていいことかんがえておいて何日から何日までってできるけど何日までの新しいのから何個分を表示してる感じになってるから何日までの方の設定だけでいいかも後ろのやつは🔻で足せるし-->
    <SearchResultList
      queryKey={["search"]}
      {filters}
      req={createRxForwardReq()}
      {viewIndex}
      {amount}
      {tieKey}
      relays={relays.length > 0 ? relays : nip50relays}
    >
      {#snippet children({ events, len })}
        <!-- <SetRepoReactions /> -->
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
                >
                  {#snippet loading()}
                    <div class="w-full">
                      <EventCard note={event} {tieKey} />
                    </div>
                  {/snippet}
                  {#snippet nodata()}
                    <div class="w-full">
                      <EventCard note={event} {tieKey} />
                    </div>
                  {/snippet}
                  {#snippet error()}
                    <div class="w-full">
                      <EventCard note={event} {tieKey} />
                    </div>
                  {/snippet}
                  {#snippet content({ metadata })}
                    <EventCard {metadata} note={event} {tieKey} />
                  {/snippet}
                </Metadata>
              </div>
            {/each}
          {/if}
        </div>{/snippet}
      {#snippet loading()}
        <div>loading</div>
      {/snippet}

      {#snippet error()}
        <div>
          {error}
        </div>
      {/snippet}
      {#snippet nodata()}
        <div>nodata</div>
      {/snippet}
    </SearchResultList>
  </div>
{/if}
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
