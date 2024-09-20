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

  let children: Token[] = [];

  // トークンが存在する場合、変換して子トークンを取得
  $: if (part?.children && Array.isArray(part.children)) {
    children = transformTokens(part.children);
    //console.log("[Transformed List]", children);
  }
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
