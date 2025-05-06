<script lang="ts">
  import {
    decodeGeohash,
    encodeGeohash,
    getCurrentLocation,
  } from "$lib/func/geohash";

  import {
    latLng,
    type LatLngExpression,
    type Map as LeafletMap,
  } from "leaflet";
  import { Check, LocateFixed, X } from "lucide-svelte";
  import { Map, TileLayer, Marker, Popup } from "sveaflet";
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";

  interface Props {
    initGeo?: string;
    position?: LatLngExpression;
    onClickSubmit?: (geo: string) => void;
    onClickDelete?: () => void;
  }
  let {
    position = $bindable([51.513, -0.09]),
    onClickSubmit,
    onClickDelete,
    initGeo,
  }: Props = $props();

  onMount(() => {
    if (initGeo) {
      const ge = decodeGeohash(initGeo);
      setLatLng([ge.latitude, ge.longitude]);
    }
  });
  let leafletMap: LeafletMap | undefined = $state(undefined);
  let popup: import("leaflet").Popup | undefined = $state(undefined);
  let popupContent = $state("I am a standalone popup.");
  $effect(() => {
    if (leafletMap) {
      leafletMap?.on("click", onMapClick);
    }
  });

  function onMapClick(e: { latlng: LatLngExpression }) {
    console.log("click");
    const latlng: LatLngExpression = e.latlng;
    setPopupContent("You clicked the map at " + latlng.toString());
    console.log(popupContent);
    setLatLng(latlng);
    openPopup();
  }
  const getLocation = async () => {
    const location: GeolocationPosition = await getCurrentLocation();
    const latlng: LatLngExpression = [
      location.coords.latitude,
      location.coords.longitude,
    ];
    setPopupContent("You clicked the map at " + latlng.toString());
    setLatLng(latlng);
    openPopup();
  };
  const setPopupContent = (str: string) => {
    popupContent = str;
  };
  const setLatLng = (_latlng: LatLngExpression) => {
    position = _latlng;
  };
  const openPopup = () => {
    if (popup && leafletMap) {
      popup.setLatLng(position);
      popup.openOn(leafletMap);
    }
  };
  let geohash = $derived(
    encodeGeohash(latLng(position).lat, latLng(position).lng)
  );
</script>

<div class="map">
  <Map
    options={{ center: [51.505, -0.09], zoom: 1 }}
    bind:instance={leafletMap}
  >
    <TileLayer
      url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
      options={{
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }}
    />
    <Marker latLng={position}>
      <Popup options={{ content: popupContent }} bind:instance={popup} />
    </Marker>
  </Map>
</div>
<div class="button-container">
  <button class="btn locate-btn" onclick={getLocation}
    ><LocateFixed />{$_("geo.location")}</button
  >
  <button class="btn confirm-btn" onclick={() => onClickSubmit?.(geohash)}
    ><Check />{$_("geo.submit")}</button
  >
  <button class="btn delete-btn" onclick={() => onClickDelete?.()}
    ><X />{$_("geo.delete")}</button
  >
</div>

<style lang="postcss">
  .map {
    @apply h-[480px] w-[640px] max-w-full rounded-md border border-blue-400 p-1;
  }
  .map {
    @apply h-[480px] w-[640px] max-w-full rounded-md border border-blue-400 p-1;
  }
  .button-container {
    @apply flex flex-wrap justify-center gap-2 mt-3;
  }
  .btn {
    @apply flex items-center justify-center rounded-full px-4 py-2 font-medium transition-colors duration-200;
  }
  .locate-btn {
    @apply bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700;
  }
  .confirm-btn {
    @apply bg-green-500 text-white hover:bg-green-600 active:bg-green-700;
  }
  .delete-btn {
    @apply bg-red-400 text-white hover:bg-red-500 active:bg-red-600;
  }
</style>
