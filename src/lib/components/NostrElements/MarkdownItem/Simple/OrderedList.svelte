<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";

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

<ol class="contentBlock my-1" start={Number(firstNum)}>
  {#if children.length > 0}
    {#each children as child, index}
      {#if child.type === "list_item"}
        <li class="contentBlock">
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
            {child.content}
          {:else}
            <!-- 空のリストアイテムに対応 -->
            <span>Empty list item</span>
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

<style lang="postcss">
  ul {
    list-style-type: disc; /* デフォルトのリストアイコン */

    padding-left: 1.5em; /* パディングを追加してアイコンとテキストの距離を調整 */
  }

  li {
    margin-bottom: 0.5em; /* 各リストアイテムの下にスペースを追加 */
  }

  /* ネストされたリストのスタイル */
  ul ul {
    margin-left: 1em; /* 左のマージンを追加 */
    list-style-type: circle; /* 内側のリストアイコン */
    margin-left: 0em; /* ネストリストの左マージンを増加 */
  }

  ul ul ul {
    list-style-type: square; /* さらにネストされたリストアイコン */
    margin-left: 0em; /* さらにネストリストの左マージンを増加 */
  }

  ol {
    list-style-type: decimal; /* Use decimal numbering */
    padding-left: 2em; /* Adjust indentation */
  }
  ol ol {
    list-style-type: lower-alpha; /* さらに内側のリストアイコン（小文字のローマ数字） */
  }
  ol ol ol {
    list-style-type: lower-roman; /* さらに内側のリストアイコン（小文字のローマ数字） */
  }
  li::marker {
    font-weight: bold; /* Make the list marker (number) bold */
  }
  ol li {
    padding-left: 0.5em;
  }
  ol ul {
    padding-left: 0.5em;
  }
  ul ol {
    padding-left: 0.5em;
  }
</style>
