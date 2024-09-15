<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import NostrContent from "./NostrContent.svelte";

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
    //console.log(children);
  }
</script>

<!-- {part.content}//こんてんとをまとめてまたmarkdownにつっこむと<p>最終的に全部で囲まれてしまうのでやれない</p> -->
<span>
  {#if children}
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
    <NostrContent
      text={part.content}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
    />
  {/if}
</span>
