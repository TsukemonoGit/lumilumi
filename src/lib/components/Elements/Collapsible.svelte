<script lang="ts">
  import { createCollapsible, melt } from "@melt-ui/svelte";
  import { ChevronsUpDown, X } from "lucide-svelte";
  import { slide } from "svelte/transition";

  const {
    elements: { root, content, trigger },
    states: { open },
  } = createCollapsible({
    forceVisible: true,
  });
</script>

<div use:melt={$root} class="relative max-w-full">
  <button use:melt={$trigger} class="flex items-center justify-between w-full">
    <div><slot name="title"></slot></div>
    <div
      class="relative h-6 w-6 place-items-center rounded-md bg-white text-sm
        text-magnum-800 shadow hover:opacity-75 data-[disabled]:cursor-not-allowed
        data-[disabled]:opacity-75"
      aria-label="Toggle"
    >
      <div class="abs-center">
        {#if $open}
          <X class="size-4" />
        {:else}
          <ChevronsUpDown class="size-4" />
        {/if}
      </div>
    </div>
  </button>

  <div>
    {#if $open}
      <div use:melt={$content} transition:slide>
        <slot name="contentEle"></slot>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .abs-center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
</style>
