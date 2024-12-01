<script lang="ts">
  import { run } from "svelte/legacy";

  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import NostrContent from "./NostrContent.svelte";
  import { untrack } from "svelte";

  interface Props {
    part: Token;
    displayMenu: any;
    depth: any;
    repostable: any;
    tags: any;
    openModal: any;
    nolist: boolean;
    tieKey: string | undefined;
  }

  let {
    part,
    displayMenu,
    depth,
    repostable,
    tags,
    openModal,
    nolist,
    tieKey,
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
                {tags}
                {openModal}
                {nolist}
                {tieKey}
              />
            {/each}
          {:else if child.content}
            <NostrContent
              text={child.content}
              {repostable}
              {depth}
              {displayMenu}
              {tags}
              {tieKey}
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
          {tags}
          {openModal}
          {nolist}
          {tieKey}
        />
      {/if}
    {/each}
  {:else}
    <!-- トークンがない場合のフォールバック -->
    <li>No content available</li>
  {/if}
</ul>
