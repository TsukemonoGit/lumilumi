<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import { transformTokens } from "$lib/func/markdown";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";

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

  // トークンが存在する場合に変換を行い、子トークンを取得

  // console.log("[table]", part);
</script>

<table class="markdown-table">
  {#if children.length > 0}
    {#each children as child}
      <!-- theadの処理 -->
      {#if child.type === "thead"}
        <thead>
          {#if child.children}
            {@const theadChildren = transformTokens(child.children)}

            {#each theadChildren as theadChild}
              {#if theadChild.type === "tr"}
                <tr
                  style={theadChild.attrs?.find(
                    (attr) => attr[0] === "style"
                  )?.[1] ?? ""}
                >
                  {#if theadChild.children}
                    {@const theadChildren2 = transformTokens(
                      theadChild.children
                    )}
                    {#each theadChildren2 as theadChild2}
                      {#if theadChild2.type === "th"}
                        <th
                          class="table-header"
                          style={theadChild2.attrs?.find(
                            (attr) => attr[0] === "style"
                          )?.[1] ?? ""}
                        >
                          {#if theadChild2.children && Array.isArray(theadChild2.children)}
                            {#each transformTokens(theadChild2.children) as thContent}
                              <SimpleContentBlock
                                part={thContent}
                                {repostable}
                                {depth}
                                {displayMenu}
                                {note}
                                {nolist}
                                {zIndex}
                              />
                            {/each}
                          {/if}
                        </th>
                      {/if}
                    {/each}{/if}
                </tr>
              {/if}
            {/each}
          {/if}
        </thead>
      {/if}

      <!-- tbodyの処理 -->
      {#if child.type === "tbody"}
        <tbody>
          {#if child.children}
            {@const tbodyChildren = transformTokens(child.children)}
            {#each tbodyChildren as tbodyRow}
              {#if tbodyRow.type === "tr"}
                <tr
                  style={tbodyRow.attrs?.find(
                    (attr) => attr[0] === "style"
                  )?.[1] ?? ""}
                >
                  {#if tbodyRow.children}
                    {#each transformTokens(tbodyRow.children) as tbodyCell}
                      {#if tbodyCell.type === "td"}
                        <td
                          class="table-cell"
                          style={tbodyCell.attrs?.find(
                            (attr) => attr[0] === "style"
                          )?.[1] ?? ""}
                        >
                          {#if tbodyCell.children && Array.isArray(child.children)}
                            {#each transformTokens(tbodyCell.children) as tdContent}
                              <SimpleContentBlock
                                part={tdContent}
                                {repostable}
                                {depth}
                                {displayMenu}
                                {note}
                                {nolist}
                                {zIndex}
                              />
                            {/each}
                          {/if}
                        </td>
                      {/if}
                    {/each}
                  {/if}
                </tr>
              {/if}
            {/each}
          {/if}
        </tbody>
      {/if}
    {/each}
  {/if}
</table>

<style lang="postcss">
  /* テーブル全体のスタイル */
  .markdown-table {
    width: 100%;
    border-collapse: collapse;
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

  /* テーブル行の偶数行の背景色 */
  tr:nth-child(even) {
    background-color: theme(colors.neutral.800);
  }
</style>
