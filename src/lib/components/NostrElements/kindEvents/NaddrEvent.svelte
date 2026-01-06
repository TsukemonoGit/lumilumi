<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import * as nip19 from "nostr-tools/nip19";

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
  let dynamicClasses = $derived(className);
  const onChange = (ev: Nostr.Event) => {
    isOmitted = omit && ev.pubkey === lumiSetting.get().pubkey;
    if (isOmitted) {
      dynamicClasses = `${className} ml-5 opacity-90 text-sm`;
    }
  };
  let naddrString: string | undefined = $derived.by(() => {
    try {
      return nip19.naddrEncode(data);
    } catch (error) {
      return undefined;
    }
  });
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
            naddr={displayMenu ? naddrString : undefined}
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
              <EmptyCard
                pulse={false}
                naddr={displayMenu ? naddrString : undefined}
                >Nodata {content ?? ""}</EmptyCard
              >{/if}
          </div>
        {/snippet}
        {#snippet error()}<EmptyCard
            pulse={false}
            naddr={displayMenu ? naddrString : undefined}
            >Nodata {content ?? ""}</EmptyCard
          >
        {/snippet}
        {#snippet success({ event })}
          <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
            {#snippet loading()}
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
            {/snippet}
            {#snippet nodata()}
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
            {/snippet}
            {#snippet error()}
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
      <EmptyCard naddr={displayMenu ? naddrString : undefined}
        >Loading {content ?? ""}</EmptyCard
      >{/if}
  </div>
{/if}
