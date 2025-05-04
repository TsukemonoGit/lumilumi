<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import NostrContent from "./NostrContent.svelte";

  interface Props {
    part: Token;
    displayMenu: any;
    depth: any;
    repostable: any;
    tags: any;
    openModal: any;
    nolist: boolean;
    tieKey: string | undefined;
    zIndex?: number | undefined;
  }

  let {
    part,
    displayMenu,
    depth,
    repostable,
    tags,
    openModal,
    nolist,
    tieKey,
    zIndex,
  }: Props = $props();

  let children: Token[] = $derived(transformTokens(part.children ?? []));
</script>

<p>
  {#if part.children && children}
    {#each children as child}
      <SimpleContentBlock
        part={child}
        {repostable}
        {depth}
        {displayMenu}
        {tags}
        {openModal}
        {nolist}
        {tieKey}
        {zIndex}
      />{/each}
  {:else}
    <NostrContent
      text={part.content}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {tieKey}
      {zIndex}
    />
  {/if}
</p>
