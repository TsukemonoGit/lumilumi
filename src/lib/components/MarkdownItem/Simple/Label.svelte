<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  //  import NostrContent from "./NostrContent.svelte";
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

  let children: Token[] = $derived.by(() => {
    if (part?.children && Array.isArray(part.children)) {
      if (part?.children) {
        return transformTokens(part.children);
      }
    }
    return [];
  });
</script>

{#each children as child}
  <SimpleContentBlock
    part={child}
    {repostable}
    {depth}
    {displayMenu}
    {note}
    {nolist}
  />
{/each}
