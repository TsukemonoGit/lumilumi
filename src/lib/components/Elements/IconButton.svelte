<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "@melt-ui/svelte";

  interface Props {
    children: Snippet;
    type?: HTMLButtonElement["type"];
    disabled?: boolean;
    onclick?: (event: MouseEvent) => void;
    useMelt?: any;
    title: string;
    className?: string;
    zIndex?: number;
    size?: number; // アイコンサイズ(px)
    variant?: "fill" | "outline" | "ghost";
  }

  const {
    children,
    type = "button",
    disabled = false,
    onclick,
    useMelt,
    title,
    className = "",
    zIndex = 0,
    size = 20,
    variant = "fill",
  }: Props = $props();

  const variantClass: Record<typeof variant, string> = {
    fill: "bg-magnum-700 text-magnum-100",
    outline: "bg-transparent border border-neutral-400 text-magnum-800",
    ghost: "bg-transparent text-magnum-800",
  };

  let buttonSizeClassName = $derived(`h-[${size + 12}px] w-[${size + 12}px]`);

  const commonClasses = [
    "inline-flex",
    "items-center",
    "justify-center",
    "rounded-full",
    "duration-100",
    "scale-95",
    "hover:scale-100",
    "active:scale-90",
  ];
</script>

{#if useMelt}
  <button
    {type}
    {disabled}
    {onclick}
    {title}
    use:melt={useMelt}
    style={`z-index:${zIndex};`}
    class={`${commonClasses.join(" ")} ${buttonSizeClassName} ${variantClass[variant]} ${className}`}
  >
    {@render children()}
  </button>
{:else}<button
    {type}
    {disabled}
    {onclick}
    {title}
    style={`z-index:${zIndex};`}
    class={`${commonClasses.join(" ")} ${buttonSizeClassName} ${variantClass[variant]} ${className}`}
  >
    {@render children()}
  </button>
{/if}
