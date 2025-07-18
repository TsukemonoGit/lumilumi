<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import * as nip19 from "nostr-tools/nip19";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import EventCard from "./EventCard/EventCard.svelte";

  import NaddrByRelayhint from "./NaddrByRelayhint.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import EmptyCard from "./EventCard/EmptyCard.svelte";
  import { viewport } from "$lib/func/useViewportAction";

  import * as Nostr from "nostr-typedef";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    data: nip19.AddressPointer;
    content: string | undefined;
    depth: number;
    displayMenu: boolean;
    repostable: boolean;

    mini?: boolean;
    thread?: boolean;
    zIndex?: number;
    omit?: boolean;
    className?: string;
  }

  let {
    data,
    content,
    depth,
    displayMenu,
    repostable,

    mini = false,
    thread = false,
    zIndex,
    omit = false,
    className,
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
  let isOmitted = $state(false);
  let dynamicClasses = $state(className);
  const onChange = (ev: Nostr.Event) => {
    isOmitted = omit && ev.pubkey === lumiSetting.get().pubkey;
    if (isOmitted) {
      dynamicClasses = `${className} ml-5 opacity-90 text-sm`;
    }
  };
</script>

{#if queryKey && data}
  <div
    class={dynamicClasses}
    use:viewport={null}
    onenterViewport={handleEnterViewport}
  >
    {#if hasLoaded}
      <LatestEvent
        {onChange}
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
                bind:isOmitted
                {omit}
                {content}
                {mini}
                {displayMenu}
                {depth}
                {repostable}
                relayhint={data.relays}
                {zIndex}
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
                  showStatus={!isOmitted}
                  note={event}
                  {displayMenu}
                  {repostable}
                  {depth}
                  mini={isOmitted || mini}
                  {thread}
                  {zIndex}
                />
              </div>
            {/snippet}
            {#snippet nodata()}
              <div>
                <EventCard
                  showStatus={!isOmitted}
                  note={event}
                  {displayMenu}
                  {repostable}
                  {depth}
                  mini={isOmitted || mini}
                  {thread}
                  {zIndex}
                />
              </div>
            {/snippet}
            {#snippet error()}
              <div>
                <EventCard
                  showStatus={!isOmitted}
                  note={event}
                  {displayMenu}
                  {repostable}
                  {depth}
                  mini={isOmitted || mini}
                  {thread}
                  {zIndex}
                />
              </div>
            {/snippet}
            {#snippet content({ metadata })}
              <EventCard
                showStatus={!isOmitted}
                {metadata}
                {displayMenu}
                note={event}
                {repostable}
                {depth}
                mini={isOmitted || mini}
                {thread}
                {zIndex}
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
