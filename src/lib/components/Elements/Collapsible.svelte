<script lang="ts">
  import { Collapsible } from "melt/builders";
  import { ChevronsUpDown, X } from "lucide-svelte";
  import { slide } from "svelte/transition";
  interface Props {
    title?: import("svelte").Snippet;
    contentEle?: import("svelte").Snippet;
  }

  let { title, contentEle }: Props = $props();
  const collapsible = new Collapsible();
</script>

<button
  {...collapsible.trigger}
  class="flex items-center justify-between w-full"
>
  <div>{@render title?.()}</div>
  <div
    class="relative h-6 w-6 place-items-center rounded-md bg-white text-sm
        text-magnum-800 shadow hover:opacity-75 data-[disabled]:cursor-not-allowed
        data-[disabled]:opacity-75"
    aria-label="Toggle"
  >
    <div class="abs-center">
      {#if collapsible.open}
        <X class="size-4" />
      {:else}
        <ChevronsUpDown class="size-4" />
      {/if}
    </div>
  </div>
</button>

<div>
  {#if collapsible.open}
    <div {...collapsible.content} transition:slide>
      {@render contentEle?.()}
    </div>
  {/if}
</div>

<style lang="postcss">
  .abs-center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
</style>
