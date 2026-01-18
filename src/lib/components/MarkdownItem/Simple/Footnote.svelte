<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import NostrContent from "./NostrContent.svelte";

  import * as Nostr from "nostr-typedef";

  interface Props {
    part: Token;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    note: Nostr.Event;

    nolist: boolean;

    zIndex?: number | undefined;
  }

  let {
    part,
    displayMenu,
    depth,
    repostable,
    note,

    nolist,

    zIndex,
  }: Props = $props();

  let children: Token[] = $derived(transformTokens(part.children ?? []));
</script>

{#if children}
  {#each children as child}
    {#if child.children}
      {#each child.children as child2}
        {#if child2.type === "footnote_anchor"}
          <a
            href="#footnote-def-{child2.meta.id}"
            id="footnote-ref-{child2.meta.id}"
            class="footnote-ref"
          >
            <sup>{child2.meta.label ?? ""}</sup>
          </a>
        {:else}
          <SimpleContentBlock
            part={child2}
            {repostable}
            {depth}
            {displayMenu}
            {note}
            {nolist}
            {zIndex}
          />{/if}
      {/each}
    {:else if note}
      <NostrContent
        event={{
          content: part.content,
          tags: note?.tags || [],
          pubkey: note?.pubkey || "",
        }}
        {repostable}
        {depth}
        {displayMenu}
        {zIndex}
      />
    {/if}{/each}
{:else}
  <NostrContent
    event={{
      content: part.content,
      tags: note?.tags || [],
      pubkey: note?.pubkey || "",
    }}
    {repostable}
    {depth}
    {displayMenu}
    {zIndex}
  />
{/if}

<style lang="postcss">
  .footnote-ref {
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
</style>
