<script lang="ts">
  import { useGeohash, type Geohash } from "$lib/func/geohash";
  import type { DecodedGeohash } from "$lib/types";

  export let geohash: string;
  export let decoded: DecodedGeohash;
  $: ogp = useGeohash(geohash, decoded);
  $: data = ogp.data;

  interface $$Slots {
    default: { contents: Geohash };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $data}
  <slot contents={$data} />
{:else}
  <slot name="nodata" />
{/if}
