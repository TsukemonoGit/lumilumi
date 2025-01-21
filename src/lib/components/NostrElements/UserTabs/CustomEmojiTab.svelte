<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import { parseNaddr } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import EllipsisMenuNaddr from "../kindEvents/NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import PaginationList from "./PaginationList.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import EventCard from "../kindEvents/EventCard/EventCard.svelte";
  import CustomEmoji from "../content/CustomEmoji.svelte";

  let { pubkey } = $props();
</script>

<LatestEvent
  queryKey={["naddr", `${10030}:${pubkey}:`]}
  filters={[{ authors: [pubkey], kinds: [10030], limit: 1 }]}
>
  {#snippet loading()}
    <div class="p-1">
      <p>Loading...</p>
    </div>
  {/snippet}

  {#snippet error()}
    <div class="p-1">
      <p>{error}</p>
    </div>
  {/snippet}
  {#snippet nodata()}
    <div class="p-1">
      <p>Loading...</p>
    </div>
  {/snippet}
  {#snippet children({ event, status })}
    {#if event}
      {@const filteredList = event.tags.filter(
        (tag) => (tag[0] === "a" || tag[0] === "emoji") && tag.length > 1
      )}
      <PaginationList list={filteredList.map((tag) => tag[1])} tieKey={pubkey}>
        {#snippet children({ id, index })}
          {#if filteredList[index][0] === "emoji"}
            <div
              class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
            >
              <CustomEmoji
                part={{
                  type: "emoji",
                  content: filteredList[index][1],
                  url: filteredList[index][2],
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
              {#snippet loading()}
                <div
                  class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
                >
                  {filteredList[index]}<EllipsisMenuNaddr
                    naddr={nip19.naddrEncode(naddr)}
                  />
                </div>
              {/snippet}
              {#snippet nodata()}
                <div
                  class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
                >
                  {filteredList[index]}<EllipsisMenuNaddr
                    naddr={nip19.naddrEncode(naddr)}
                  />
                </div>
              {/snippet}
              {#snippet error()}
                <div
                  class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
                >
                  {filteredList[index]}<EllipsisMenuNaddr
                    naddr={nip19.naddrEncode(naddr)}
                  />
                </div>
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
                        tieKey={pubkey}
                      />
                    </div>
                  {/snippet}
                  {#snippet nodata()}
                    <div>
                      <EventCard
                        note={event}
                        displayMenu={true}
                        repostable={true}
                        tieKey={pubkey}
                      />
                    </div>
                  {/snippet}
                  {#snippet error()}
                    <div>
                      <EventCard
                        note={event}
                        displayMenu={true}
                        repostable={true}
                        tieKey={pubkey}
                      />
                    </div>
                  {/snippet}
                  {#snippet content({ metadata })}
                    <EventCard
                      {metadata}
                      displayMenu={true}
                      repostable={true}
                      note={event}
                      tieKey={pubkey}
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
