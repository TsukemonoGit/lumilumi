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

{#if part.children && children}
  {#each children as child}
    <SimpleContentBlock
      part={child}
      {repostable}
      {depth}
      {displayMenu}
      {note}
      {nolist}
      {zIndex}
    />{/each}
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
