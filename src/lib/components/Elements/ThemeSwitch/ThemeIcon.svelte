<script lang="ts">
  import type { Theme } from "$lib/types";
  import { Moon, Sun, Monitor } from "lucide-svelte";

  interface Props {
    theme?: Theme;
    size?: "sm" | "md" | "lg";
  }

  const { theme = "light", size = "md" }: Props = $props();

  const sizeMap = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  const component = $derived(theme === "dark" ? Moon : theme === "light" ? Sun : Monitor);

  const SvelteComponent = $derived(component);
</script>

<SvelteComponent class={sizeMap[size]} />
