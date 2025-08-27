<script lang="ts">
  import { useGeohash, type Geohash } from "$lib/func/geohash";
  import type { DecodedGeohash } from "$lib/types";

  interface Props {
    geohash: string;
    decoded: DecodedGeohash;
    children?: import('svelte').Snippet<[any]>;
    nodata?: import('svelte').Snippet;
  }

  const {
    geohash,
    decoded,
    children,
    nodata
  }: Props = $props();
  const ogp = $derived(useGeohash(geohash, decoded));
  const data = $derived(ogp.data);

  interface $$Slots {
    default: { contents: Geohash };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $data}
  {@render children?.({ contents: $data, })}
{:else}
  {@render nodata?.()}
{/if}
