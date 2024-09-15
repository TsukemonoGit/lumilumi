<script lang="ts">
  import type { Token } from "markdown-it/index.js";

  export let part: Token;

  //console.log("[fence]", part);
</script>

<pre><code>{part.content}</code></pre>

<style lang="postcss">
  /* コードブロック全体のスタイル */
  pre {
    background-color: theme(colors.neutral.800); /* ダークテーマ背景色 */
    border-radius: 8px; /* 角を丸くする */
    padding: 8px 16px; /* 内側に余白を作る */

    font-family: "Courier New", Courier, monospace; /* 等幅フォントを使用 */
    margin: 1em 0;
    @apply whitespace-pre-wrap break-words overflow-x-auto;
    word-break: break-word;
  }

  /* コード内のスタイル */
  code {
    color: theme(colors.neutral.100); /* コードの文字色（明るめの白色） */
    font-size: 14px; /* 文字サイズを調整 */
  }
</style>
