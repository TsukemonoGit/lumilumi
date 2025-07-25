<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import { parseNaddr } from "$lib/func/util";
  import * as nip19 from "nostr-tools/nip19";

  import PaginationList from "./PaginationList.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import EventCard from "../kindEvents/EventCard/EventCard.svelte";
  import CustomEmoji from "../content/CustomEmoji.svelte";
  import EmptyCardList from "../kindEvents/EventCard/EmptyCardList.svelte";
  import EmptyCard from "../kindEvents/EventCard/EmptyCard.svelte";

  let { pubkey } = $props();
</script>

<LatestEvent
  queryKey={["naddr", `${10030}:${pubkey}:`]}
  filters={[{ authors: [pubkey], kinds: [10030], limit: 1 }]}
>
  {#snippet loading()}
    <EmptyCardList length={10} />
  {/snippet}

  {#snippet error()}
    <div class="p-1">
      <p>{error}</p>
    </div>
  {/snippet}
  {#snippet nodata()}
    <div class="p-1">
      <p>nodata</p>
    </div>
  {/snippet}
  {#snippet children({ event, status })}
    {#if event}
      {@const filteredList = event.tags
        .filter(
          (tag) => (tag[0] === "a" || tag[0] === "emoji") && tag.length > 1
        )
        .slice()
        .reverse()}
      <PaginationList list={filteredList.map((tag) => tag[1])}>
        {#snippet children(li, index)}
          {@const id = li as string}
          {#if filteredList[index][0] === "emoji"}
            <div
              class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
            >
              <CustomEmoji
                part={{
                  type: "custom_emoji",
                  content: filteredList[index][1],
                  metadata: {
                    url: filteredList[index][2],
                  },
                  start: 0,
                  end: 0,
                }}
              />
            </div>
          {:else if filteredList[index][0] === "a"}
            {@const naddr = parseNaddr(filteredList[index])}
            <LatestEvent
              queryKey={[
                "naddr",
                `${naddr.kind}:${naddr.pubkey}:${naddr.identifier}`,
              ]}
              filters={[
                naddr.identifier !== ""
                  ? {
                      kinds: [naddr.kind],
                      authors: [naddr.pubkey],
                      "#d": [naddr.identifier],
                    }
                  : {
                      kinds: [naddr.kind],
                      authors: [naddr.pubkey],
                    },
              ]}
            >
              {#snippet loading()}<EmptyCard naddr={nip19.naddrEncode(naddr)}
                  >loading {filteredList[index]}</EmptyCard
                >
              {/snippet}
              {#snippet nodata()}<EmptyCard naddr={nip19.naddrEncode(naddr)}
                  >not found {filteredList[index]}</EmptyCard
                >
              {/snippet}
              {#snippet error()}<EmptyCard naddr={nip19.naddrEncode(naddr)}
                  >not found {filteredList[index]}</EmptyCard
                >
              {/snippet}
              {#snippet children({ event })}
                <Metadata
                  queryKey={["metadata", event.pubkey]}
                  pubkey={event.pubkey}
                >
                  {#snippet loading()}
                    <div>
                      <EventCard
                        note={event}
                        displayMenu={true}
                        repostable={true}
                      />
                    </div>
                  {/snippet}
                  {#snippet nodata()}
                    <div>
                      <EventCard
                        note={event}
                        displayMenu={true}
                        repostable={true}
                      />
                    </div>
                  {/snippet}
                  {#snippet error()}
                    <div>
                      <EventCard
                        note={event}
                        displayMenu={true}
                        repostable={true}
                      />
                    </div>
                  {/snippet}
                  {#snippet content({ metadata })}
                    <EventCard
                      {metadata}
                      displayMenu={true}
                      repostable={true}
                      note={event}
                    />
                  {/snippet}
                </Metadata>
              {/snippet}
            </LatestEvent>
            <!---->
          {:else if filteredList[index][0] === "t"}
            [t,{id}]
            <!---->
          {:else}
            <!---->
            [r,{id}]
          {/if}
        {/snippet}
      </PaginationList>{/if}
  {/snippet}
</LatestEvent>
