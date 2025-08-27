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

  const {
    type = "button",
    disabled = false,
    onclick,
    useMelt,
    title,
    ariaLabel,
    className = "",
    zIndex = 0,
    size = 24,
  }: Props = $props();
</script>

<button
  {type}
  {disabled}
  {onclick}
  title={title ?? ariaLabel}
  aria-label={ariaLabel}
  use:melt={useMelt}
  style={`z-index: ${zIndex};`}
  class={`absolute right-1 top-1 inline-flex h-7 w-7 appearance-none
                items-center justify-center rounded-full text-magnum-800 bg-magnum-200 scale-95
                 opacity-80 hover:opacity-100 hover:scale-100 active:bg-magnum-200 active:scale-90 ${className}
  `}
>
  <X {size} />
</button>
