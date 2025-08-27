<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import NostrContent from "./NostrContent.svelte";
  import * as Nostr from "nostr-typedef";

  interface Props {
    part: Token;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    note: Nostr.Event;

    nolist: boolean;

    zIndex?: number | undefined;
  }

  const {
    part,
    displayMenu,
    depth,
    repostable,
    note,

    nolist,

    zIndex,
  }: Props = $props();
  //console.log(part);
  const children: Token[] = $derived(transformTokens(part.children ?? []));

  const url = $derived(part.attrs?.find((attr) => attr[0] === "href")?.[1]);
  const href = $derived(url?.startsWith("nostr:") ? `./${url.slice(6)}` : url);
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
        {note}
        {nolist}
        {zIndex}
      />{/each}
  {:else}
    <NostrContent
      event={{ content: part.content, tags: note.tags, pubkey: note.pubkey }}
      {repostable}
      {depth}
      {displayMenu}
      {zIndex}
    />
  {/if}
</a>
