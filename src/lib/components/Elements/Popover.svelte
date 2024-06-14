<script lang="ts">
  //Popover.svelte
  import { createPopover, createSync, melt } from "@melt-ui/svelte";
  import { X } from "lucide-svelte";
  import { fade } from "svelte/transition";
  export let open = false;

  const {
    elements: { trigger, content, arrow, close },
    states,
  } = createPopover({
    forceVisible: true,
  });

  const sync = createSync(states);
  $: sync.open(open, (v) => (open = v));
</script>

<button
  class="hover:opacity-75 active:opacity-50 text-magnum-500"
  use:melt={$trigger}
>
  <slot></slot>
</button>
{#if open}
  <div use:melt={$content} transition:fade={{ duration: 100 }} class="content">
    <div use:melt={$arrow}></div>
    <div class="flex flex-col gap-2.5">
      <slot name="popoverContent"></slot>
    </div>
    <button class="close" use:melt={$close}>
      <X class="size-4" />
    </button>
  </div>
{/if}

<style lang="postcss">
  .input {
    @apply flex h-8 w-full rounded-md border border-magnum-800 bg-transparent px-2.5 text-sm;
    @apply ring-offset-magnum-300 focus-visible:ring;
    @apply focus-visible:ring-magnum-400 focus-visible:ring-offset-1;
    @apply flex-1 items-center justify-center;
    @apply px-2.5 text-sm leading-none text-magnum-700;
  }

  .trigger {
    @apply inline-flex h-9 w-9 items-center justify-center rounded-full bg-white p-0;
    @apply text-sm font-medium text-magnum-900 transition-colors hover:bg-white/90;
    @apply focus-visible:ring focus-visible:ring-magnum-400 focus-visible:ring-offset-2;
  }

  .close {
    @apply absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full;
    @apply text-magnum-900 transition-colors hover:bg-magnum-500/10;
    @apply focus-visible:ring focus-visible:ring-magnum-400 focus-visible:ring-offset-2;
    @apply bg-white p-0 text-sm font-medium;
  }

  .content {
    @apply z-20 rounded-[4px] bg-neutral-800 p-2 shadow-md;
  }
</style>
