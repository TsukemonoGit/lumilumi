<script>
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import { parseNaddr } from "$lib/func/util";
  import * as nip19 from "nostr-tools/nip19";

  import EventCard from "../kindEvents/EventCard/EventCard.svelte";
  import Note from "../kindEvents/Note.svelte";
  import EllipsisMenuNaddr from "../kindEvents/NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import PaginationList from "./PaginationList.svelte";
  import EmptyCardList from "../kindEvents/EventCard/EmptyCardList.svelte";

  let { pubkey } = $props();
</script>

<!---->
<LatestEvent
  queryKey={["naddr", `${10003}:${pubkey}:`]}
  filters={[{ authors: [pubkey], kinds: [10003], limit: 1 }]}
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
      {@const filteredList = event.tags.filter(
        (tag) =>
          (tag[0] === "e" ||
            tag[0] === "t" ||
            tag[0] === "r" ||
            tag[0] === "a") &&
          tag.length > 1
      )}
      <PaginationList list={filteredList.map((tag) => tag[1])}>
        {#snippet children({ id, index })}
          {#if filteredList[index][0] === "e"}
            <Note
              {id}
              mini={false}
              displayMenu={true}
              depth={0}
              repostable={true}
            />
            <!---->
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
