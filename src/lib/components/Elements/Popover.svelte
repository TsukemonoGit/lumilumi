<script lang="ts">
  //Popover.svelte
  import { createPopover, createSync, melt } from "@melt-ui/svelte";
  import { X } from "lucide-svelte";
  import { fade } from "svelte/transition";
  const {
    elements: { trigger, content, arrow, close },
    states,
  } = createPopover({
    forceVisible: true,
  });
  interface Props {
    open?: boolean;
    ariaLabel: string;
    zIndex?: number;
    showCloseButton?: boolean;
    children?: import("svelte").Snippet;
    popoverContent?: import("svelte").Snippet;
  }

  let {
    open = $bindable(false),
    ariaLabel,
    zIndex = 20,
    showCloseButton = true,
    children,
    popoverContent,
  }: Props = $props();
  const sync = createSync(states);
  $effect.pre(() => {
    sync.open(open, (v) => (open = v));
  });
</script>

<button
  class="hover:opacity-75 active:opacity-50 w-fit"
  aria-label={ariaLabel}
  use:melt={$trigger}>{@render children?.()}</button
>{#if open}<div
    use:melt={$content}
    transition:fade={{ duration: 100 }}
    class="content"
    style={`z-index:${zIndex}`}
  >
    <div use:melt={$arrow}></div>
    <div class="flex flex-col gap-2.5">{@render popoverContent?.()}</div>
    {#if showCloseButton}<button class="close" use:melt={$close}>
        <X class="size-4" /></button
      >{/if}
  </div>{/if}

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
    @apply text-magnum-900 transition-colors hover:bg-magnum-100/50;
    @apply focus-visible:ring focus-visible:ring-magnum-400 focus-visible:ring-offset-2;
    @apply bg-white p-0 text-sm font-medium;
  }

  .content {
    @apply rounded-[4px] bg-neutral-800 p-2 shadow-md max-w-[90%];
  }
</style>
