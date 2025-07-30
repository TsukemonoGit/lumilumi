<script lang="ts">
  let { children } = $props<{
    children: import("svelte").Snippet;
  }>();
  import "$lib/i18n/index.ts";
  import { onMount } from "svelte";
  import "../../../app.css";
  import type { Theme } from "$lib/types";
  import { setTheme } from "$lib/func/settings";
  onMount(() => {
    //await nostrLogin.launch();
    const theme = (localStorage?.getItem("theme") as Theme) ?? "system";
    // console.log(theme);
    setTheme(theme);
  });
</script>

{@render children?.()}
