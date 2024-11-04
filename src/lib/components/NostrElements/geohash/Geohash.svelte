<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";

  import { MapPinned, ExternalLink, MapPin } from "lucide-svelte";
  import UseGeohash from "./UseGeohash.svelte";
  import { decodeGeohash } from "$lib/func/geohash";

  export let geohash: string;
  $: decoded = decodeGeohash(geohash);
  //https://www.google.com/maps/@42.60500787757337,140.85379661992192,10z//ズームレベル変わるけどピンが刺さらない
  //https://www.google.com/maps?q=42.60500787757337,140.85379661992192//ピンが刺さるけどズームされすぎ
  //`https://www.openstreetmap.org/#map=10/${decoded.latitude}/${decoded.longitude}`
  $: mapLink = `https://www.google.com/maps?q=${decoded.latitude},${decoded.longitude}`;

  let getgeodata: boolean;
  function handleClickAddress() {
    getgeodata = true;
  }
</script>

{#if !getgeodata}
  <button
    class="inline-flex float-end text-magnum-500/75 mx-1 hover:opacity-75"
    on:click={handleClickAddress}
  >
    <MapPin size={20} />
  </button>
{:else}
  <Link
    className="inline-flex float-end text-magnum-500/75  mx-1 hover:opacity-75 items-center"
    href={mapLink}
    ><UseGeohash {decoded} {geohash} let:contents>
      <div class="text-xs inline-flex float-end mx-1 text-magnum-500 underline">
        {contents.display_name ?? "Location not found"}
      </div>
    </UseGeohash><MapPinned size={20} /><!--<ExternalLink size={12} />--></Link
  >
{/if}
