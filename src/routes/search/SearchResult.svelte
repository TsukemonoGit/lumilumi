<script lang="ts">
  import { createRxForwardReq } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import Metadata from "../../lib/components/renderSnippets/nostr/Metadata.svelte";

  import { nip50relays } from "$lib/func/constants";
  import EventCard from "../../lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";

  import { onDestroy } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import SearchResultList from "./SearchResultList.svelte";
  import { defaultRelays, queryClient } from "$lib/stores/stores";
  import { unsucscribeSearch } from "$lib/func/useReq";

  let amount = 50;
  let viewIndex = 0;
  interface Props {
    filters: Nostr.Filter[];
    relays: string[];
    eventFilter: (ev: Nostr.Event) => boolean;
  }

  let { filters, relays, eventFilter }: Props = $props();
  const req = createRxForwardReq();
  $inspect(filters);

  onDestroy(() => {
    console.log("onDestroy");
    unsucscribeSearch();
    // queryClient.cancelQueries({
    //   queryKey: ["search"],
    // });
    // queryClient.cancelQueries({ queryKey: ["search", "olderData"] });
    queryClient.removeQueries({ queryKey: ["search"] });
    queryClient.removeQueries({ queryKey: ["search", "olderData"] });
    //console.log("cancelQueries");
  });

  // eventFilterにsearchプロパティがあるかチェックして、リレーを決定
  const selectedRelays = $derived.by(() => {
    // 1. 検索フィルターが存在するかをチェック
    const hasSearchFilter = filters.some((fil) => fil.search);

    if (hasSearchFilter) {
      // 2. 検索フィルターがある場合:
      //    'relays'が存在すればそれを使用し、なければ'nip50relays'を使用
      return relays.length > 0 ? relays : nip50relays;
    }

    // 1. デフォルトリレーから読み取り可能なURLを取得
    const readRelayUrls: string[] = $defaultRelays
      ? Object.entries($defaultRelays)
          .filter(([url, config]) => config.read)
          .map(([url, config]) => config.url)
      : [];

    //  URLで重複を排除
    const merged = Array.from(new Set([...readRelayUrls, ...relays]));

    // フォールバック: 取得できない場合は検索用既知リレーへ
    return merged.length > 0 ? merged : nip50relays;
  });
</script>

{#if filters && Object.values($defaultRelays).length > 0}
  <!--untilが設定されてたら現在のあれをあれしなくていいことかんがえておいて何日から何日までってできるけど何日までの新しいのから何個分を表示してる感じになってるから何日までの方の設定だけでいいかも後ろのやつは🔻で足せるし-->
  <SearchResultList
    queryKey={["search"]}
    {eventFilter}
    {filters}
    {req}
    {viewIndex}
    {amount}
    relays={selectedRelays}
  >
    {#snippet children({ events, len })}
      <!-- <SetRepoReactions /> -->
      <div class="w-full break-words divide-y divide-magnum-600/30">
        {#if events && events.length > 0}
          {#each events as event, index (event.id)}
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
            >
              {#snippet loading()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet error()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet content({ metadata })}
                <EventCard {metadata} note={event} />
              {/snippet}
            </Metadata>
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
{/if}
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
