<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import type { nip19 } from "nostr-tools";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import EventCard from "./EventCard/EventCard.svelte";

  import { loginUser, queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";
  import EmptyCard from "./EventCard/EmptyCard.svelte";
  import * as Nostr from "nostr-typedef";

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
    zIndex?: number;
    omit: boolean;
    isOmitted?: boolean;
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
    zIndex,
    omit,
    isOmitted = $bindable(),
  }: Props = $props();
  let queryKey = $derived([
    "naddr",
    `${data.kind}:${data.pubkey}:${data.identifier}`,
  ] as QueryKey);
  const queryCheck = async (queryKey: QueryKey) => {
    //console.log(queryKey, relayhint);
    // if (!queryClient.getQueryData(queryKey)) {//見つかんないときにリレーヒントから探すからない
    queryClient.removeQueries({ queryKey: queryKey });
    //   }
    return;
  };

  const onChange = (ev: Nostr.Event) => {
    isOmitted = omit && ev.pubkey === $loginUser;
  };
</script>

{#await queryCheck(queryKey)}<EmptyCard
    naddr={displayMenu ? content?.slice(6) : undefined}
    >Loading {content ?? ""}</EmptyCard
  >
{:then}
  <LatestEvent
    {onChange}
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
      <EmptyCard naddr={displayMenu ? content?.slice(6) : undefined}
        >Loading {content ?? ""}</EmptyCard
      >
    {/snippet}
    {#snippet nodata()}
      <EmptyCard naddr={displayMenu ? content?.slice(6) : undefined}
        >Nodata {content ?? ""}</EmptyCard
      >
    {/snippet}
    {#snippet error()}
      <EmptyCard naddr={displayMenu ? content?.slice(6) : undefined}
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
              mini={isOmitted || mini}
              showStatus={isOmitted}
              {thread}
              {zIndex}
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
              mini={isOmitted || mini}
              showStatus={isOmitted}
              {thread}
              {zIndex}
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
              mini={isOmitted || mini}
              showStatus={isOmitted}
              {thread}
              {zIndex}
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
            mini={isOmitted || mini}
            showStatus={isOmitted}
            {thread}
            {zIndex}
          />
        {/snippet}
      </Metadata>
    {/snippet}
  </LatestEvent>
{/await}
