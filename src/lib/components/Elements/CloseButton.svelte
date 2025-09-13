<script lang="ts">
  import { melt } from "@melt-ui/svelte";
  import { X } from "lucide-svelte";
  import type { Snippet } from "svelte";

  interface Props {
    type?: HTMLButtonElement["type"];
    disabled?: boolean;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
    useMelt?: any;
    title?: string;
    ariaLabel: string;
    className?: string;
    zIndex?: number;
    size?: number; // Xアイコンサイズ
  }

  let {
    type = "button",
    disabled = false,
    onclick,
    useMelt,
    title,
    ariaLabel,
    className = "",
    zIndex = 0,
    size = 26,
  }: Props = $props();
</script>

{#if useMelt}
  <button
    {type}
    {disabled}
    {onclick}
    title={title ?? ariaLabel}
    aria-label={ariaLabel}
    use:melt={useMelt}
    style={`z-index: ${zIndex};width:${size}px; height:${size}px`}
    class={`absolute right-1 top-1 inline-flex  appearance-none
                items-center justify-center rounded-full text-magnum-800 bg-magnum-200 scale-95
                 opacity-80 hover:opacity-100 hover:scale-100 active:bg-magnum-200 active:scale-90 ${className}
  `}
  >
    <X size={size - 2} />
  </button>
{:else}<button
    {type}
    {disabled}
    {onclick}
    title={title ?? ariaLabel}
    aria-label={ariaLabel}
    style={`z-index: ${zIndex};width:${size}px; height:${size}px`}
    class={`absolute right-1 top-1 inline-flex  appearance-none
                items-center justify-center rounded-full text-magnum-800 bg-magnum-200 scale-95
                 opacity-80 hover:opacity-100 hover:scale-100 active:bg-magnum-200 active:scale-90 ${className}
  `}
  >
    <X size={size - 2} />
  </button>
{/if}
