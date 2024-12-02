<script lang="ts">
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import type { nip19 } from "nostr-tools";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import EventCard from "./EventCard/EventCard.svelte";

  import { queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";

  interface Props {
    data: nip19.AddressPointer;
    content: string | undefined;
    depth: number;
    displayMenu: boolean;
    repostable: boolean;
    tieKey: string | undefined;
    mini?: boolean;
    thread?: boolean;
    relayhint: string[];
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
    relayhint,
  }: Props = $props();
  let queryKey = $derived([
    "naddr",
    `${data.kind}:${data.pubkey}:${data.identifier}`,
  ] as QueryKey);
  const queryCheck = async (queryKey: QueryKey) => {
    //console.log(queryKey, relayhint);
    // if (!$queryClient.getQueryData(queryKey)) {//見つかんないときにリレーヒントから探すからない
    $queryClient.removeQueries({ queryKey: queryKey });
    //   }
    return;
  };
</script>

{#await queryCheck(queryKey)}
  <div
    class="text-sm text-neutral-500 flex-inline break-all grid grid-cols-[1fr_20px] align-middle justify-between"
  >
    <div>Loading {content ?? ""}</div>
    {#if displayMenu}<EllipsisMenuNaddr naddr={content?.slice(6)} />{/if}
  </div>
{:then}
  <LatestEvent
    relays={relayhint}
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
    {#snippet loading()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all grid grid-cols-[1fr_20px] align-middle justify-between"
      >
        <div>Loading {content ?? ""}</div>
        {#if displayMenu}<EllipsisMenuNaddr naddr={content?.slice(6)} />{/if}
      </div>
    {/snippet}
    {#snippet nodata()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        Nodata {content ?? ""}{#if displayMenu}<EllipsisMenuNaddr
            naddr={content?.slice(6)}
          />{/if}
      </div>
    {/snippet}
    {#snippet error()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        {content}{#if displayMenu}<EllipsisMenuNaddr
            naddr={content?.slice(6)}
          />{/if}
      </div>
    {/snippet}
    {#snippet children({ event })}
      {event}
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
{/await}
