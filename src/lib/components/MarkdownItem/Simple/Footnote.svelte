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
            {tags}
            {openModal}
            {nolist}
            {tieKey}
          />{/if}
      {/each}
    {:else}
      <NostrContent
        text={child.content}
        {repostable}
        {depth}
        {displayMenu}
        {tags}
        {tieKey}
      />
    {/if}{/each}
{:else}
  <NostrContent
    text={part.content}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {tieKey}
  />
{/if}

<style lang="postcss">
  .footnote-ref {
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
</style>
