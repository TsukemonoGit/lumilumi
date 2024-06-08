<script lang="ts">
  import type { Theme } from "$lib/types";
  import { Moon, Sun, Monitor } from "lucide-svelte";

  export let theme: Theme = "light";
  export let size: "sm" | "md" | "lg" = "md";

  const sizeMap = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  $: component = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
</script>

<svelte:component this={component} class={sizeMap[size]} />
