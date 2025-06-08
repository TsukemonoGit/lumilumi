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
      {tags}
      {openModal}
      {nolist}
      {zIndex}
    />{/each}
{:else}
  <NostrContent
    event={{ content: part.content, tags }}
    {repostable}
    {depth}
    {displayMenu}
    {zIndex}
  />
{/if}
