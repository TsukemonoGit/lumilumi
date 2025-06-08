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
  //console.log(part);
  let children: Token[] = $derived(transformTokens(part.children ?? []));

  let url = $derived(part.attrs?.find((attr) => attr[0] === "href")?.[1]);
  let href = $derived(url?.startsWith("nostr:") ? `./${url.slice(6)}` : url);
</script>

<a
  class="inline underline text-magnum-300 break-all hover:opacity-80"
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
        {zIndex}
      />{/each}
  {:else}
    <NostrContent
      event={{ content: part.content, tags: tags }}
      {repostable}
      {depth}
      {displayMenu}
      {zIndex}
    />
  {/if}
</a>
