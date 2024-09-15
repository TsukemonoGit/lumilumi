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
    //console.log(children);
  }
</script>

<s>
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
</s>
