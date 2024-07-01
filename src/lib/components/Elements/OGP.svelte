<script lang="ts">
  import { useOgp, type Ogp } from "$lib/func/ogp";

  export let url: string;

  $: ogp = useOgp(url);
  $: data = ogp.data;

  interface $$Slots {
    default: { contents: Ogp };
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
