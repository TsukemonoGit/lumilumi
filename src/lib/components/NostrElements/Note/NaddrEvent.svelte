<script lang="ts">
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import type { nip19 } from "nostr-tools";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import EventCard from "./EventCard/EventCard.svelte";
  import { relayRegex } from "$lib/func/regex";

  export let data: nip19.AddressPointer;
  export let content: string | undefined;
  export let depth: number;
  export let displayMenu: boolean;
  export let repostable: boolean;
  export let tieKey: string | undefined;
  export let mini: boolean = false;
  export let thread: boolean = false;
</script>

<LatestEvent
  queryKey={["naddr", `${data.kind}:${data.pubkey}:${data.identifier}`]}
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
  let:event
>
  <div
    slot="loading"
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
  >
    {content}{#if displayMenu}<EllipsisMenuNaddr
        naddr={content?.slice(6)}
      />{/if}
  </div>
  <div slot="nodata">
    {#if data.relays && data.relays.length > 0}
      <!--relay hint の方で探してみる-->
      <LatestEvent
        relays={data.relays}
        queryKey={["naddr", `${data.kind}:${data.pubkey}:${data.identifier}`]}
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
        let:event
      >
        <div
          slot="loading"
          class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
        >
          <div>{content}</div>
          {#if displayMenu}<EllipsisMenuNaddr naddr={content?.slice(6)} />{/if}
        </div>
        <div
          slot="nodata"
          class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
        >
          <div>{content}</div>
          {#if displayMenu}<EllipsisMenuNaddr naddr={content?.slice(6)} />{/if}
        </div>
        <div
          slot="error"
          class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
        >
          <div>{content}</div>
          {#if displayMenu}<EllipsisMenuNaddr naddr={content?.slice(6)} />{/if}
        </div>
        <Metadata
          queryKey={["metadata", event.pubkey]}
          pubkey={event.pubkey}
          let:metadata
        >
          <div slot="loading">
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
          <div slot="nodata">
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
          <div slot="error">
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
          <EventCard
            {metadata}
            {displayMenu}
            note={event}
            {repostable}
            {tieKey}
            {depth}
            {mini}
            {thread}
          /></Metadata
        >
      </LatestEvent>
    {:else}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        {content}

        {#if displayMenu}<EllipsisMenuNaddr naddr={content?.slice(6)} />{/if}
      </div>{/if}
    <!---->
  </div>
  <div
    slot="error"
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
  >
    <div>{content}</div>
    {#if displayMenu}<EllipsisMenuNaddr naddr={content?.slice(6)} />{/if}
  </div>
  <Metadata
    queryKey={["metadata", event.pubkey]}
    pubkey={event.pubkey}
    let:metadata
  >
    <div slot="loading">
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
    <div slot="nodata">
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
    <div slot="error">
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
    <EventCard
      {metadata}
      {displayMenu}
      note={event}
      {repostable}
      {tieKey}
      {depth}
      {mini}
      {thread}
    /></Metadata
  >
</LatestEvent>
