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

  let children: Token[] = [];

  // トークンが存在する場合に変換を行い、子トークンを取得
  $: if (part?.children && Array.isArray(part.children)) {
    children = transformTokens(part.children);
    //  console.log("[Transformed Ordered List]", children);
  }
  $: firstNum = children[0].info;
  // $: console.log(firstNum);
</script>

<ol class=" my-1" start={Number(firstNum)}>
  {#if children && children.length > 0}
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
              />
            {/each}
          {:else if child.content}
            <NostrContent
              text={child.content}
              {repostable}
              {depth}
              {displayMenu}
              {tags}
            />
          {/if}
        </li>
      {:else}
        <!-- リストアイテム以外のトークンに対応 -->
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
        />
      {/if}
    {/each}
  {:else}
    <!-- トークンがない場合のフォールバック -->
    <li class="contentBlock">No content available</li>
  {/if}
</ol>
