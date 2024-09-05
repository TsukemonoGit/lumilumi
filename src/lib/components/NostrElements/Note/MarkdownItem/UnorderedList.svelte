<script lang="ts">
  import type { Part } from "$lib/func/content";
  import ContentBlock from "./ContentBlock.svelte";
  import Markdown from "./Markdown.svelte";

  export let part: Part;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  //  console.log(part);
</script>

<ul>
  <li>
    <Markdown
      text={part.content ?? ""}
      {tags}
      {displayMenu}
      {depth}
      {repostable}
    />
    {#each part.list ?? [] as listItem}
      {#if listItem.type === "unorderedList"}
        <ul>
          <li>
            <Markdown
              text={listItem.content ?? ""}
              {tags}
              {displayMenu}
              {depth}
              {repostable}
            />
            {#each listItem.list ?? [] as nestedItem}
              <ContentBlock
                part={nestedItem}
                {tags}
                {displayMenu}
                {depth}
                {repostable}
                {openModal}
              />
            {/each}
          </li>
        </ul>
      {:else}
        <Markdown
          text={listItem.content ?? ""}
          {tags}
          {displayMenu}
          {depth}
          {repostable}
        />
      {/if}
    {/each}
  </li>
</ul>

<style lang="postcss">
  /* ベースのリストスタイル */
  ul {
    list-style-type: disc; /* デフォルトのリストアイコン */
    margin-left: 1em; /* 左のマージンを追加 */
    padding-left: 1em; /* パディングを追加してアイコンとテキストの距離を調整 */
  }

  li {
    margin-bottom: 0.5em; /* 各リストアイテムの下にスペースを追加 */
  }

  /* ネストされたリストのスタイル */
  ul ul {
    list-style-type: circle; /* 内側のリストアイコン */
    margin-left: 0em; /* ネストリストの左マージンを増加 */
  }

  ul ul ul {
    list-style-type: square; /* さらにネストされたリストアイコン */
    margin-left: 0em; /* さらにネストリストの左マージンを増加 */
  }

  /* 必要に応じて追加の階層スタイルをここに追加 */
</style>
