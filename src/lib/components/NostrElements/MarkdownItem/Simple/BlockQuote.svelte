<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import Content from "../../Note/Content.svelte";

  export let part: Token;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  // console.log("[blockQuote]", part);

  let children: Token[];
  $: if (part.children) {
    children = transformTokens(part.children);
    // console.log("[blockquote]", children);
  }
</script>

{#if part.content.trim() !== ""}
  <blockquote>
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
        />{/each}
    {:else}
      <Content text={part.content} {repostable} {depth} {displayMenu} {tags} />
    {/if}
  </blockquote>
{/if}

<style lang="postcss">
  blockquote {
    padding: 0.5em 1.5em;
    margin: 1em 0;
    border-left: 5px solid rgb(var(--color-magnum-500) / 1); /* 引用の左側にカラーテーマに基づくライン */
    background-color: rgb(
      var(--color-neutral-800) / 1
    ); /* 背景色をカラーテーマに基づく */
    color: rgb(
      var(--color-neutral-50) / 1
    ); /* テキスト色をカラーテーマに基づく */
    font-style: italic;
    quotes: "“" "”" "‘" "’";
    line-height: 1.5;
    /* position: relative; 擬似要素の位置を調整するために必要 */
  }

  /* blockquote::before {
    content: open-quote;
    font-size: 2em;
    color: rgb(var(--color-magnum-500) / 1);
    position: absolute;
    left: 0.2em;
    top: 0; 
    line-height: 1;
  }

  blockquote::after {
    content: close-quote;
    font-size: 2em;
    color: rgb(var(--color-magnum-500) / 1);
    position: absolute;
    padding-left: 0.2em;
    bottom: 0; 
  } */
</style>
