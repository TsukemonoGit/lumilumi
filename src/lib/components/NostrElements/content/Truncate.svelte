<!--Truncate.svelte-->
<script lang="ts">
  import { useTruncate } from "$lib/func/useTruncate";

  interface Props {
    maxHeight?: number;
    children: any;
    depth: number;
    onClickShowMore: () => void;
  }
  let {
    maxHeight = 460,
    children,
    onClickShowMore,
    depth = 0,
  }: Props = $props();
  const threshold = 160; // 例えば20px以上大きい場合にのみ"Show More"ボタンを表示
  let isTruncated = $state(false);

  function toggleShowMore() {
    onClickShowMore?.();
  }

  // depth が深くなるほど contentHeight が小さくなるように計算し、最小の高さを設定
  const minHeight = 100; // 最小の高さを設定
  let contentHeight = $derived(
    Math.max(maxHeight * Math.pow(0.8, depth * 1.8), minHeight)
  );
  // maxHeight = 380のとき、
  // depth が 4 以上 のときに contentHeight が 100 を下回ります。
</script>

<div
  use:useTruncate={{
    maxHeight: contentHeight,
    isTruncated: (value) => (isTruncated = value),
    threshold,
  }}
  class="mt-0.5 overflow-y-auto overflow-x-hidden max-w-full"
  style={!isTruncated
    ? ""
    : `max-height: ${contentHeight}px; overflow: hidden;`}
>
  {@render children?.()}
  {#if isTruncated}
    <div class="truncate-overlay"></div>
  {/if}
</div>
{#if isTruncated}
  <button
    onclick={toggleShowMore}
    class="h-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
  >
    Show More
  </button>
{/if}

<style>
  .truncate-overlay {
    position: absolute;
    bottom: 2rem; /* ボタンの高さに合わせて調整 */
    left: 0;
    right: 0;
    height: 3rem; /* フェードアウトの高さ */
    background: linear-gradient(
      to bottom,
      rgb(var(--color-neutral-900) / 0),
      rgb(var(--color-neutral-900) / 0.6)
    );
    pointer-events: none;
  }
</style>
