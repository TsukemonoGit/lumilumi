<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import { decodeGeohash } from "$lib/func/event";
  import { MapPinned, ExternalLink } from "lucide-svelte";

  export let geohash: string;
  $: decoded = decodeGeohash(geohash);
  //https://www.google.com/maps/@42.60500787757337,140.85379661992192,10z//ズームレベル変わるけどピンが刺さらない
  //https://www.google.com/maps?q=42.60500787757337,140.85379661992192//ピンが刺さるけどズームされすぎ
  //`https://www.openstreetmap.org/#map=10/${decoded.latitude}/${decoded.longitude}`
  $: mapLink = `https://www.google.com/maps?q=${decoded.latitude},${decoded.longitude}`;
</script>

<Link
  className="inline-flex float-end text-magnum-500/75  mx-1 hover:opacity-75"
  href={mapLink}><MapPinned size={20} /><!--<ExternalLink size={12} />--></Link
>
