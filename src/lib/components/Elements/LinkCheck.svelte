<script lang="ts">
  import { isvalidURL } from "$lib/func/ogp";
  import type { Snippet } from "svelte";

  const { url, ok, ng }: { url: string; ok: Snippet; ng: Snippet } = $props();
  const status = $state(isvalidURL(url));
</script>

{#if status}
  {@render ok()}
{:else}
  {@render ng()}
{/if}
