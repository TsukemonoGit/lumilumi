<script lang="ts">
  //Popover.svelte
  import { Popover as PopoverPrimitive } from "bits-ui";

  import CloseButton from "./CloseButton.svelte";
  import type { Snippet } from "svelte";

  type Side = "top" | "right" | "bottom" | "left";
  type Align = "start" | "center" | "end";

  interface Props {
    open?: boolean;
    ariaLabel: string;
    zIndex?: number;
    showCloseButton?: boolean;
    children?: Snippet;
    popoverContent?: Snippet;
    onOpenChange?: (open: boolean) => void;
    buttonClass?: string;
    style?: string;
    side?: Side;
    align?: Align;
  }

  let {
    open = $bindable(false),
    ariaLabel,
    style,
    zIndex = 20,
    showCloseButton = true,
    children,
    popoverContent,
    onOpenChange,
    buttonClass = "hover:opacity-75 active:opacity-50 w-fit",
    side = "bottom",
    align = "center",
  }: Props = $props();

  $effect(() => {
    onOpenChange?.(open);
  });
</script>

<PopoverPrimitive.Root bind:open>
  <PopoverPrimitive.Trigger class={buttonClass} aria-label={ariaLabel} {style}>
    {@render children?.()}
  </PopoverPrimitive.Trigger>
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      class="rounded-[4px] bg-neutral-800 p-2 text-neutral-100 shadow-md max-w-[90vw]"
      style={`z-index:${zIndex}`}
      {side}
      {align}
    >
      <div class="flex flex-col gap-2.5">
        {@render popoverContent?.()}
      </div>
      {#if showCloseButton}
        <CloseButton onclick={() => (open = false)} ariaLabel="close" />
      {/if}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
</PopoverPrimitive.Root>
