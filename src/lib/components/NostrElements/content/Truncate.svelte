<!--Truncate.svelte-->
<script lang="ts">
  import { useTruncate } from "$lib/func/useTruncate";

  interface Props {
    maxHeight?: number;
    children: any;
    onClickShowMore: () => void;
  }
  let { maxHeight = 320, children, onClickShowMore }: Props = $props();
  const threshold = 100; // 例えば20px以上大きい場合にのみ"Show More"ボタンを表示
  let showFullContent = $state(false);

  let isTruncated = $state(false);

  function toggleShowMore() {
    //showFullContent = !showFullContent;
    onClickShowMore?.();
  }
</script>

<div
  use:useTruncate={{
    maxHeight,
    isTruncated: (value) => (isTruncated = value),
    threshold,
  }}
  class="mt-0.5 overflow-y-auto overflow-x-hidden"
  style={!isTruncated || showFullContent
    ? ""
    : `max-height: ${maxHeight}px; overflow: hidden;`}
>
  {@render children?.()}
</div>
{#if isTruncated}
  <button
    onclick={toggleShowMore}
    class="h-8 items-center justify-center rounded-full border border-zinc-600
bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
  >
    {#if showFullContent}
      Show Less
    {/if}
    {#if !showFullContent}
      Show More
    {/if}
  </button>
{/if}
