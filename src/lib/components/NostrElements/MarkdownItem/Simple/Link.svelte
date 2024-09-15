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
    // console.log(children);
  }
  $: href = part.attrs?.find((attr) => attr[0] === "href")?.[1];
</script>

<a
  class="underline text-magnum-300 break-all"
  href={href?.startsWith("nostr:") ? `./${href.slice(6)}` : href}
  target="_blank"
  rel="noopener noreferrer"
>
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
    <NostrContent
      text={part.content}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
    />
  {/if}
</a>
