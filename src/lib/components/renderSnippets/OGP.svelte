<script lang="ts">
  import { useOgp, type Ogp } from "$lib/func/ogp";

  interface Props {
    url: string;
    renderContent?: import("svelte").Snippet<[Ogp]>;
    nodata?: import("svelte").Snippet;
  }

  const { url, renderContent, nodata }: Props = $props();

  const ogp = $derived(useOgp(url));
  const data = $derived(ogp.data);
</script>

{#if $data && renderContent}
  {@render renderContent($data)}
{:else}
  {@render nodata?.()}
{/if}
