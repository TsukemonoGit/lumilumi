<script lang="ts">
  import { useUrl, type UrlType } from "$lib/func/useUrl";
  import type { Snippet } from "svelte";

  interface Props {
    url: string;
    content?: Snippet<[UrlType]>;
    loading?: Snippet;
  }

  const { url, content, loading }: Props = $props();

  const urlType = $derived(useUrl(url));
  const data = $derived(urlType.data);
</script>

{#if $data}
  {@render content?.($data)}
{:else}
  {@render loading?.()}
{/if}
