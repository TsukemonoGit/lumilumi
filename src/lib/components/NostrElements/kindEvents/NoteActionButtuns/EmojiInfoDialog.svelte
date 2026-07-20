<script lang="ts">
  import type { Token } from "@konemono/nostr-content-parser";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import Kind30030Note from "../EventCard/Kind30030Note.svelte";
  import { parseNaddr } from "$lib/func/util";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import * as Nostr from "nostr-typedef";

  type EmojiToken = Extract<Token, { type: "custom_emoji" }>;
  interface Props {
    emojiTokens: EmojiToken[];
    zIndex: number | undefined;
  }

  const depth = 10;
  const maxHeight = undefined;

  let { emojiTokens, zIndex }: Props = $props();

  let currentIndex = $state(0);

  let currentToken = $derived(emojiTokens[currentIndex]);
  let currentEmojiSetAddress = $derived(currentToken.metadata.emojiSetAddress);
  let currentNaddr = $derived(
    currentEmojiSetAddress
      ? parseNaddr(["a", currentEmojiSetAddress])
      : undefined,
  );
  function goToNext() {
    if (emojiTokens.length > 0) {
      currentIndex = (currentIndex + 1) % emojiTokens.length;
    }
  }

  function goToPrev() {
    if (emojiTokens.length > 0) {
      currentIndex =
        (currentIndex - 1 + emojiTokens.length) % emojiTokens.length;
    }
  }
</script>

<div class="grid grid-cols-[auto_1fr_auto]">
  <button
    onclick={goToPrev}
    class="p-1 w-fit h-fit self-center rounded hover:bg-neutral-700"
  >
    <ChevronLeft class="w-6 h-6 text-neutral-300" />
  </button>

  <div class="flex flex-col gap-4 p-2">
    <span class="text-lg font-bold text-neutral-200">
      {currentToken.metadata.name}
    </span>
    <div class="flex justify-center">
      <img
        src={currentToken.metadata.url}
        alt={currentToken.content}
        class="max-h-32 w-auto object-contain"
      />
    </div>

    <div class="break-all text-xs text-neutral-400 self-center">
      {currentToken.metadata.url}
    </div>

    {#if currentEmojiSetAddress && currentNaddr}
      <div class="border border-neutral-700 rounded-lg p-3">
        <LatestEvent
          queryKey={[
            "naddr",
            `${currentNaddr.kind}:${currentNaddr.pubkey}:${currentNaddr.identifier}`,
          ]}
          filters={[
            currentNaddr.identifier !== ""
              ? {
                  kinds: [currentNaddr.kind],
                  authors: [currentNaddr.pubkey],
                  "#d": [currentNaddr.identifier],
                }
              : { kinds: [currentNaddr.kind], authors: [currentNaddr.pubkey] },
          ]}
        >
          {#snippet loading()}
            <div class="text-sm text-neutral-400">loading...</div>
          {/snippet}
          {#snippet nodata()}
            <div class="text-sm text-neutral-400">not found</div>
          {/snippet}
          {#snippet error()}
            <div class="text-sm text-neutral-400">error</div>
          {/snippet}
          {#snippet success({ event })}
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
            >
              {#snippet loading()}
                {@render eventDisplay(event, undefined)}
              {/snippet}
              {#snippet nodata()}
                {@render eventDisplay(event, undefined)}{/snippet}
              {#snippet error()}
                {@render eventDisplay(event, undefined)}{/snippet}
              {#snippet content({ metadata })}
                {@render eventDisplay(event, metadata)}{/snippet}</Metadata
            >
          {/snippet}
        </LatestEvent>
      </div>
    {/if}<span class="text-sm text-neutral-400 ml-4 self-center">
      {currentIndex + 1} / {emojiTokens.length}
    </span>
  </div>
  <button
    onclick={goToNext}
    class="p-1 w-fit h-fit self-center rounded hover:bg-neutral-700"
  >
    <ChevronRight class="w-6 h-6 text-neutral-300" />
  </button>
</div>

{#snippet eventDisplay(event: Nostr.Event, metadata: Nostr.Event | undefined)}
  <Kind30030Note
    note={event}
    mini={true}
    repostable={true}
    {maxHeight}
    displayMenu={false}
    {metadata}
    {depth}
    {zIndex}
    showStatus={false}
  />
{/snippet}
