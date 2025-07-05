<script lang="ts">
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  import { encodetoNote } from "$lib/func/encode";
  import NoteByRelayhint from "./NoteByRelayhint.svelte";
  import EmptyCard from "./EventCard/EmptyCard.svelte";
  import { viewport } from "$lib/func/useViewportAction";

  import * as Nostr from "nostr-typedef";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    id: string;
    mini?: boolean;
    maxHeight?: number;
    displayMenu: boolean;
    thread?: boolean;
    depth: number;
    repostable: boolean;

    relayhint?: string[] | undefined;
    zIndex?: number;
    omit?: boolean;
    onChange?: (ev: Nostr.Event) => void;
    className?: string;
  }

  let {
    id,
    mini = false,
    maxHeight,
    displayMenu,
    thread = false,
    depth,
    repostable,

    relayhint = undefined,
    zIndex,
    omit = false,
    onChange,
    className,
  }: Props = $props();
  let loadingText = $derived(encodetoNote(id));

  let hasLoaded = $state(false);
  const handleEnterViewport = () => {
    if (!hasLoaded) {
      hasLoaded = true;
    }
  };
  let isOmitted = $state(false);
  let dynamicClasses = $state(className);
  const handleOnChange = (ev: Nostr.Event) => {
    isOmitted = omit && ev.pubkey === lumiSetting.get().pubkey;
    if (isOmitted) {
      dynamicClasses = `${className} ml-5 opacity-90 text-sm`;
    }
    onChange?.(ev);
  };
</script>

{#if id}
  <div
    class={dynamicClasses}
    use:viewport={null}
    onenterViewport={handleEnterViewport}
  >
    {#if hasLoaded}
      <Text queryKey={["note", id]} {id} onChange={handleOnChange}>
        {#snippet loading()}
          <EmptyCard nevent={displayMenu ? loadingText : undefined}
            >Loading {loadingText}</EmptyCard
          >{/snippet}
        {#snippet nodata()}
          {#if relayhint && relayhint.length > 0}
            <NoteByRelayhint
              bind:isOmitted
              {id}
              {omit}
              {mini}
              {displayMenu}
              {depth}
              {repostable}
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
          <Metadata queryKey={["metadata", text.pubkey]} pubkey={text.pubkey}>
            {#snippet loading()}
              <EventCard
                note={text}
                mini={isOmitted || mini}
                showStatus={!isOmitted}
                {maxHeight}
                {thread}
                {depth}
                {repostable}
                {zIndex}
              />
            {/snippet}
            {#snippet nodata()}
              <EventCard
                note={text}
                mini={isOmitted || mini}
                showStatus={!isOmitted}
                {maxHeight}
                {thread}
                {depth}
                {repostable}
                {zIndex}
              />
            {/snippet}
            {#snippet error()}
              <EventCard
                note={text}
                mini={isOmitted || mini}
                showStatus={!isOmitted}
                {maxHeight}
                {thread}
                {depth}
                {repostable}
                {zIndex}
              />
            {/snippet}
            {#snippet content({ metadata })}
              <EventCard
                note={text}
                {metadata}
                mini={isOmitted || mini}
                showStatus={!isOmitted}
                {maxHeight}
                {thread}
                {displayMenu}
                {depth}
                {repostable}
                {zIndex}
              />
            {/snippet}
          </Metadata><!-- {/if} -->
        {/snippet}
      </Text>
    {:else}
      <EmptyCard nevent={displayMenu ? loadingText : undefined}
        >Loading {loadingText}</EmptyCard
      >{/if}
  </div>
{/if}
