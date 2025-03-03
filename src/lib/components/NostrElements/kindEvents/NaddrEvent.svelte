<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import type { nip19 } from "nostr-tools";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import EventCard from "./EventCard/EventCard.svelte";

  import NaddrByRelayhint from "./NaddrByRelayhint.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import EmptyCard from "./EventCard/EmptyCard.svelte";
  import { viewport } from "$lib/func/useViewportAction";

  interface Props {
    data: nip19.AddressPointer;
    content: string | undefined;
    depth: number;
    displayMenu: boolean;
    repostable: boolean;
    tieKey: string | undefined;
    mini?: boolean;
    thread?: boolean;
  }

  let {
    data,
    content,
    depth,
    displayMenu,
    repostable,
    tieKey,
    mini = false,
    thread = false,
  }: Props = $props();
  let queryKey = $derived([
    "naddr",
    `${data.kind}:${data.pubkey}:${data.identifier}`,
  ] as QueryKey);

  let hasLoaded = $state(false);
  const handleEnterViewport = () => {
    if (!hasLoaded) {
      hasLoaded = true;
    }
  };
</script>

{#if queryKey}
  <div use:viewport={null} onenterViewport={handleEnterViewport}>
    {#if hasLoaded}
      <LatestEvent
        {queryKey}
        filters={[
          data.identifier !== ""
            ? {
                kinds: [data.kind],
                authors: [data.pubkey],
                "#d": [data.identifier],
              }
            : {
                kinds: [data.kind],
                authors: [data.pubkey],
              },
        ]}
      >
        {#snippet loading()}<EmptyCard
            naddr={displayMenu ? content?.slice(6) : undefined}
            >Loading {content ?? ""}</EmptyCard
          >{/snippet}
        {#snippet nodata()}
          <div>
            {#if data.relays && data.relays.length > 0}
              <NaddrByRelayhint
                {data}
                {content}
                {mini}
                {displayMenu}
                {depth}
                {repostable}
                {tieKey}
                relayhint={data.relays}
              />
            {:else}
              <div
                class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
              >
                Nodata {content ?? ""}{#if displayMenu}<EllipsisMenuNaddr
                    naddr={content?.slice(6)}
                  />{/if}
              </div>{/if}
          </div>
        {/snippet}
        {#snippet error()}<EmptyCard
            naddr={displayMenu ? content?.slice(6) : undefined}
            >Nodata {content ?? ""}</EmptyCard
          >
        {/snippet}
        {#snippet children({ event })}
          <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
            {#snippet loading()}
              <div>
                <EventCard
                  note={event}
                  {displayMenu}
                  {repostable}
                  {tieKey}
                  {depth}
                  {mini}
                  {thread}
                />
              </div>
            {/snippet}
            {#snippet nodata()}
              <div>
                <EventCard
                  note={event}
                  {displayMenu}
                  {repostable}
                  {tieKey}
                  {depth}
                  {mini}
                  {thread}
                />
              </div>
            {/snippet}
            {#snippet error()}
              <div>
                <EventCard
                  note={event}
                  {displayMenu}
                  {repostable}
                  {tieKey}
                  {depth}
                  {mini}
                  {thread}
                />
              </div>
            {/snippet}
            {#snippet content({ metadata })}
              <EventCard
                {metadata}
                {displayMenu}
                note={event}
                {repostable}
                {tieKey}
                {depth}
                {mini}
                {thread}
              />
            {/snippet}
          </Metadata>
        {/snippet}
      </LatestEvent>
    {:else}
      <EmptyCard naddr={displayMenu ? content?.slice(6) : undefined}
        >Loading {content ?? ""}</EmptyCard
      >{/if}
  </div>
{/if}
