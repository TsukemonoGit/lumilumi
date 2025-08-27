<script lang="ts">
  import { melt } from "@melt-ui/svelte";
  import type { Snippet } from "svelte";

  type Variant =
    | "reaction"
    | "userMenu"
    | "modal"
    | "poll"
    | "pin"
    | "channel"
    | "menu"
    | "status"
    | "followList"
    | "inputSend"
    | "icon";

  type Size = "md" | "sm" | "lg";
  interface Props {
    variant?: Variant;
    type?: HTMLButtonElement["type"];
    disabled?: boolean;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
    useMelt?: any;
    title?: string;
    ariaLabel: string;
    className?: string;
    size?: Size;
  }

  const {
    variant = "menu",
    type = "button",
    disabled = false,
    children,
    onclick,
    useMelt,
    title,
    ariaLabel,
    className = "",
    size = "md",
  }: Props = $props();
</script>

<button
  {type}
  {disabled}
  {onclick}
  title={title ?? ariaLabel}
  aria-label={ariaLabel}
  use:melt={useMelt}
  class={`inline-flex items-center justify-center rounded-md transition
    ${variant === "reaction" ? "p-1 text-magnum-400 opacity-80 hover:opacity-100 hover:bg-magnum-100" : ""}
    ${variant === "userMenu" ? "px-3 py-1 rounded-full bg-magnum-200 hover:bg-magnum-300 text-neutral-700 text-sm font-medium" : ""}
    ${variant === "modal" ? "w-8 h-8 rounded-full bg-neutral-200/70 hover:bg-neutral-300 text-neutral-500 hover:text-neutral-700" : ""}
    ${variant === "poll" ? "px-4 py-2 border border-neutral-300 rounded-md bg-white hover:bg-neutral-100 text-neutral-600" : ""}
    ${variant === "pin" ? "px-2 py-1 bg-magnum-100 border border-magnum-300 rounded text-sm hover:bg-magnum-200 text-magnum-600" : ""}
    ${variant === "channel" ? "px-3 py-2 bg-magnum-500 text-white font-bold rounded-md hover:bg-magnum-600" : ""}
    ${variant === "menu" ? "px-3 py-1 border border-neutral-200 rounded-md bg-white hover:bg-neutral-100 text-sm text-neutral-700" : ""}
    ${variant === "status" ? "px-3 py-1 bg-magnum-100 border border-magnum-300 text-magnum-600 rounded text-sm hover:bg-magnum-200" : ""}
    ${variant === "followList" ? "px-2 py-1 border border-neutral-300 rounded text-sm hover:bg-neutral-100 text-neutral-600" : ""}
    ${variant === "inputSend" ? "px-3 py-2 bg-magnum-400 text-white rounded-md hover:bg-magnum-500 active:scale-95" : ""}
    ${
      variant === "icon"
        ? `${size === "sm" ? "w-7 h-7" : size === "md" ? "w-9 h-9" : "w-11 h-11"} 
       border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800 rounded-full`
        : ""
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}
  `}
>
  {@render children?.()}
</button>
