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

  let children: Token[] = $derived.by(() => {
    if (part?.children && Array.isArray(part.children)) {
      if (part?.children) {
        return transformTokens(part.children);
      }
    }
    return [];
  });
</script>

<ul>
  {#if children.length > 0}
    {#each children as child, index}
      {#if child.type === "list_item"}
        <li>
          {#if child.children && Array.isArray(child.children)}
            {#each transformTokens(child.children) as child2}
              <SimpleContentBlock
                part={child2}
                {repostable}
                {depth}
                {displayMenu}
                {note}
                {nolist}
                {zIndex}
              />
            {/each}
          {:else if child.content}
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
        </li>
      {:else}
        <!-- 非リストアイテムの場合はそのまま表示 -->
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
        />
      {/if}
    {/each}
  {:else}
    <!-- トークンがない場合のフォールバック -->
    <li>No content available</li>
  {/if}
</ul>
