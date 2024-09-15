<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import Content from "../../Note/Content.svelte";
  import { transformTokens } from "$lib/func/markdown";

  export let part: Token;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  let children: Token[];
  $: if (part.children) {
    children = transformTokens(part.children);
    console.log("[footnoteRef]", children);
  }
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
          />{/if}
      {/each}{/if}{/each}
{:else}
  <Content text={part.content} {repostable} {depth} {displayMenu} {tags} />
{/if}

<style lang="postcss">
  .footnote-def {
    text-decoration: underline;
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }

  .footnote-ref {
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
</style>
