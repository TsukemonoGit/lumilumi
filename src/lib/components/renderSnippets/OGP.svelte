<script lang="ts">
  import { useOgp, type Ogp } from "$lib/func/ogp";

  interface Props {
    url: string;
    renderContent?: import("svelte").Snippet<[Ogp]>;
    nodata?: import("svelte").Snippet;
  }

  let { url, renderContent, nodata }: Props = $props();

  let ogp = $derived(useOgp(url));
  let data = $derived(ogp.data);
</script>

{#if $data && renderContent}
  {@render renderContent($data)}
{:else}
  {@render nodata?.()}
{/if}
