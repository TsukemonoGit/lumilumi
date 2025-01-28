<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";

  import { MapPinned, ExternalLink, MapPin } from "lucide-svelte";
  import UseGeohash from "./UseGeohash.svelte";
  import { decodeGeohash } from "$lib/func/geohash";

  interface Props {
    geohash: string;
  }

  let { geohash }: Props = $props();
  let decoded = $derived(decodeGeohash(geohash));
  //https://www.google.com/maps/@42.60500787757337,140.85379661992192,10z//ズームレベル変わるけどピンが刺さらない
  //https://www.google.com/maps?q=42.60500787757337,140.85379661992192//ピンが刺さるけどズームされすぎ
  //`https://www.openstreetmap.org/#map=10/${decoded.latitude}/${decoded.longitude}`
  let mapLink = $derived(
    `https://www.google.com/maps?q=${decoded.latitude},${decoded.longitude}`
  );

  let getgeodata: boolean = $state(false);
  function handleClickAddress() {
    getgeodata = true;
  }
</script>

{#if !getgeodata}
  <button
    class="inline-flex float-end text-magnum-500/75 mx-1 hover:opacity-75"
    onclick={handleClickAddress}
  >
    <MapPin size={20} />
  </button>
{:else}
  <Link
    className="inline-flex float-end text-magnum-500/75 text-right mx-1 hover:opacity-75 items-center text-xs underline gap-1"
    href={mapLink}
    >{#snippet content()}<UseGeohash {decoded} {geohash}>
        {#snippet children({ contents })}
          {contents.display_name ?? "Location not found"}
        {/snippet}
      </UseGeohash><MapPinned size={20} class="min-w-4" />
    {/snippet}</Link
  >
{/if}
