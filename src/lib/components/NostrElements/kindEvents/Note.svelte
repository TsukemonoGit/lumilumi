<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  import { encodetoNote } from "$lib/func/encode";
  import NoteByRelayhint from "./NoteByRelayhint.svelte";
  import EmptyCard from "./EventCard/EmptyCard.svelte";
  import { viewport } from "$lib/func/useViewportAction";

  interface Props {
    id: string;
    mini?: boolean;
    maxHeight?: number;
    displayMenu: boolean;
    thread?: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
    relayhint?: string[] | undefined;
  }

  let {
    id,
    mini = false,
    maxHeight,
    displayMenu,
    thread = false,
    depth,
    repostable,
    tieKey,
    relayhint = undefined,
  }: Props = $props();
  let loadingText = $derived(encodetoNote(id));

  let hasLoaded = $state(false);
  const handleEnterViewport = () => {
    if (!hasLoaded) {
      hasLoaded = true;
    }
  };
</script>

<div use:viewport={null} onenterViewport={handleEnterViewport}>
  {#if hasLoaded}
    <Text queryKey={["timeline", id]} {id}>
      {#snippet loading()}
        <EmptyCard nevent={displayMenu ? loadingText : undefined}
          >Loading {loadingText}</EmptyCard
        >{/snippet}
      {#snippet nodata()}
        {#if relayhint && relayhint.length > 0}
          <NoteByRelayhint
            {id}
            {mini}
            {displayMenu}
            {depth}
            {repostable}
            {tieKey}
            {relayhint}
          />
        {:else}<EmptyCard nevent={displayMenu ? loadingText : undefined}
            >nodata {loadingText}</EmptyCard
          >{/if}
      {/snippet}
      {#snippet error()}
        <EmptyCard nevent={displayMenu ? loadingText : undefined}
          >nodata {loadingText}</EmptyCard
        >
      {/snippet}
      {#snippet content({ data: text, status })}
        <Metadata queryKey={["metadata", text.pubkey]} pubkey={text.pubkey}>
          {#snippet loading()}
            <EventCard
              note={text}
              {mini}
              {maxHeight}
              {thread}
              {depth}
              {repostable}
              {tieKey}
            />
          {/snippet}
          {#snippet nodata()}
            <EventCard
              note={text}
              {mini}
              {maxHeight}
              {thread}
              {depth}
              {repostable}
              {tieKey}
            />
          {/snippet}
          {#snippet error()}
            <EventCard
              note={text}
              {mini}
              {maxHeight}
              {thread}
              {depth}
              {repostable}
              {tieKey}
            />
          {/snippet}
          {#snippet content({ metadata })}
            <EventCard
              note={text}
              {metadata}
              {mini}
              {maxHeight}
              {thread}
              {displayMenu}
              {depth}
              {repostable}
              {tieKey}
            />
          {/snippet}
        </Metadata>
      {/snippet}
    </Text>
  {:else}
    <EmptyCard nevent={displayMenu ? loadingText : undefined}
      >Loading {loadingText}</EmptyCard
    >{/if}
</div>
