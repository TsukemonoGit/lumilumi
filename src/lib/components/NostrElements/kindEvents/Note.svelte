<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  import { encodetoNote } from "$lib/func/encode";
  import NoteByRelayhint from "./NoteByRelayhint.svelte";
  import EmptyCard from "./EventCard/EmptyCard.svelte";
  import { viewport } from "$lib/func/useViewportAction";
  import { page } from "$app/state";
  import { loginUser } from "$lib/stores/stores";
  import OmittedCard from "./EventCard/OmittedCard.svelte";

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
    zIndex?: number;
    omit?: boolean;
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
    zIndex,
    omit = false,
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
            {zIndex}
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
        {#if omit && text.pubkey === $loginUser}
          <OmittedCard
            {text}
            {depth}
            {repostable}
            {maxHeight}
            {displayMenu}
            {tieKey}
            {zIndex}
          />
        {:else}
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
                {zIndex}
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
                {zIndex}
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
                {zIndex}
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
                {zIndex}
              />
            {/snippet}
          </Metadata>{/if}
      {/snippet}
    </Text>
  {:else}
    <EmptyCard nevent={displayMenu ? loadingText : undefined}
      >Loading {loadingText}</EmptyCard
    >{/if}
</div>
