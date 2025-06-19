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

{#if children}
  <hr class=" my-4" />
  <div class="text-lg font-bold my-2">Footnotes</div>
  <ul>
    {#each children as child}
      <li>
        {#if child.children}
          {#each transformTokens(child.children) as child2}
            {#if child2.type !== "footnote_anchor"}
              <SimpleContentBlock
                part={child2}
                {repostable}
                {depth}
                {displayMenu}
                {note}
                {nolist}
                {zIndex}
              />{:else}
              <a
                href="#footnote-ref-{child2.meta.id}"
                id="footnote-def-{child2.meta.id}"
                class="footnote-def mx-1">[{child2.meta.id}]</a
              >{/if}{/each}
        {:else}
          <NostrContent
            event={{
              content: part.content,
              tags: note.tags,
              pubkey: note.pubkey,
            }}
            {repostable}
            {depth}
            {displayMenu}
            {zIndex}
          />
        {/if}
      </li>{/each}
  </ul>{:else}
  <NostrContent
    event={{ content: part.content, tags: note.tags, pubkey: note.pubkey }}
    {repostable}
    {depth}
    {displayMenu}
    {zIndex}
  />{/if}

<style lang="postcss">
  .footnote-def {
    text-decoration: underline;
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
</style>
