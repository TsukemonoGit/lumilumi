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
  export let tieKey: string | undefined;
  //console.log(part);
  let children: Token[];
  $: if (part.children) {
    children = transformTokens(part.children);
  }
  $: url = part.attrs?.find((attr) => attr[0] === "href")?.[1];
  $: href = url?.startsWith("nostr:") ? `./${url.slice(6)}` : url;
</script>

<a
  class="underline text-magnum-300 break-all hover:opacity-80"
  {href}
  target="_blank"
  rel="noopener noreferrer"
  title={href}
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
        {tieKey}
      />{/each}
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
</a>
