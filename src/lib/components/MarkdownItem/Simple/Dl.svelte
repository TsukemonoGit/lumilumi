<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import NostrContent from "./NostrContent.svelte";

  import NotabPart from "./NotabPart.svelte";

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

  let {
    part,
    displayMenu,
    depth,
    repostable,
    note,

    nolist,

    zIndex,
  }: Props = $props();

  let children: Token[] = $derived(transformTokens(part.children ?? []));
</script>

<dl>
  {#if part.children && children}
    {#each children as child}
      {#if child.type === "dd"}
        <dd>
          <NotabPart
            part={child}
            {repostable}
            {depth}
            {displayMenu}
            {note}
            {nolist}
          />
        </dd>
      {:else if child.type === "dt"}
        <dt>
          <NotabPart
            part={child}
            {repostable}
            {depth}
            {displayMenu}
            {note}
            {nolist}
          />
        </dt>
      {:else}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
          {zIndex}
        />
      {/if}{/each}
  {:else}
    <NostrContent
      event={{ content: part.content, tags: note.tags, pubkey: note.pubkey }}
      {repostable}
      {depth}
      {displayMenu}
      {zIndex}
    />
  {/if}
</dl>

<style>
  dl {
    margin: 1.5rem 0;
    padding: 0;
    font-family: Arial, sans-serif;
    line-height: 1.5;

    border-radius: 8px;
  }

  dt {
    font-weight: bold;
    margin-top: 1rem;

    border-radius: 4px;
  }

  dd {
    margin-left: 1rem;
    /*   padding-left: 0.5rem;*/

    font-size: 0.9rem;
  }

  /* オプション: <dl> 全体のスタイルを微調整 */
  dl > dt:first-child {
    margin-top: 0;
  }

  dl > dd:last-child {
    margin-bottom: 0;
  }
</style>
