<script lang="ts">
  import type { Part } from "$lib/func/content";
  import Markdown from "../Markdown.svelte";

  export let part: Part;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
</script>

<table class="markdown-table">
  <thead>
    <tr>
      {#each part.headers ?? [] as header}
        <th class="table-header">{header}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each part.rows ?? [] as row}
      <tr>
        {#each row as cell}
          <td class="table-cell"
            ><Markdown
              text={cell}
              {tags}
              {displayMenu}
              {depth}
              {repostable}
            /></td
          >
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style lang="postcss">
  /* テーブル全体のスタイル */
  .markdown-table {
    width: 100%;
    border-collapse: collapse; /* ボーダーを重ねて表示しない */
    margin: 20px 0;
  }

  /* ヘッダーセルのスタイル */
  .table-header {
    background-color: theme(colors.neutral.600);
    text-align: left;
    padding: 8px;
    border-bottom: 2px solid theme(colors.neutral.700);
  }

  /* ボディセルのスタイル */
  .table-cell {
    padding: 8px;
    border-bottom: 1px solid theme(colors.neutral.700);
  }

  /* テーブル行のスタイル */
  tr:nth-child(even) {
    background-color: theme(colors.neutral.800);
  }
</style>
