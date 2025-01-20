<script lang="ts">
  import { useUrl, type UrlType } from "$lib/func/useUrl";
  import type { Snippet } from "svelte";

  interface Props {
    url: string;
    content?: Snippet<[UrlType]>;
    loading?: Snippet;
  }

  let { url, content, loading }: Props = $props();

  let urlType = $derived(useUrl(url));
  let data = $derived(urlType.data);
</script>

{#if $data}
  {@render content?.($data)}
{:else}
  {@render loading?.()}
{/if}
