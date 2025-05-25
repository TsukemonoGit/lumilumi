<!--Truncate.svelte-->
<script lang="ts">
  import { useTruncate } from "$lib/func/useTruncate";
  import type { Snippet } from "svelte";
  import { t as _ } from '@konemono/svelte5-i18n';

  interface Props {
    maxHeight?: number;
    children: any;
    depth: number;
    onClickShowMore: () => void;
    truncate?: Snippet;
  }
  let {
    maxHeight = 460,
    children,
    onClickShowMore,
    depth = 0,
    truncate,
  }: Props = $props();
  let threshold = $derived(maxHeight * 0.35); // 160例えば20px以上大きい場合にのみ"Show More"ボタンを表示
  let isTruncated = $state(false);

  function toggleShowMore() {
    onClickShowMore?.();
  }

  // depth が深くなるほど contentHeight が小さくなるように計算し、最小の高さを設定
  let minHeight = $derived(maxHeight * 0.2); // 100 最小の高さを設定
  let contentHeight = $derived(
    Math.max(Math.floor(maxHeight * Math.pow(0.8, depth * 1.8)), minHeight)
  );

  // maxHeight = 380のとき、
  // depth が 4 以上 のときに contentHeight が 100 を下回ります。
</script>

{#if contentHeight}
  <div
    use:useTruncate={{
      maxHeight: contentHeight,
      isTruncated: (value) => (isTruncated = value),
      threshold,
    }}
    class="mt-0.5 overflow-hidden max-w-full relative"
    style={!isTruncated
      ? ""
      : `max-height: ${contentHeight}px; overflow: hidden;`}
  >
    {@render children?.()}
    {#if isTruncated}
      <div class=" truncate-overlay"></div>
    {/if}
  </div>
  {#if isTruncated}
    {#if truncate}
      {@render truncate?.()}
    {:else}
      <button
        onclick={toggleShowMore}
        class="h-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
      >
        {$_("truncate.expand")}
      </button>
    {/if}
  {/if}
{/if}

<style>
  .truncate-overlay {
    position: absolute;
    bottom: 0; /* ボタンの高さに合わせて調整 */
    left: 0;
    right: 0;
    height: 2rem; /* フェードアウトの高さ */
    background: linear-gradient(
      to bottom,
      rgb(var(--color-neutral-900) / 0),
      rgb(var(--color-neutral-900) / 0.6)
    );
    pointer-events: none;
  }
</style>
