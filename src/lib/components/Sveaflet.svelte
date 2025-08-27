<script lang="ts">
  import {
    decodeGeohash,
    encodeGeohash,
    getCurrentLocation,
  } from "$lib/func/geohash";
  import { toastSettings } from "$lib/stores/stores";

  import {
    latLng,
    type LatLngExpression,
    type Map as LeafletMap,
  } from "leaflet";
  import { Check, LocateFixed, Search, X } from "lucide-svelte";
  import { Map, TileLayer, Marker, Popup } from "sveaflet";
  import { onMount } from "svelte";
  import { t as _ } from '@konemono/svelte5-i18n';

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
  const geohash = $derived(
    encodeGeohash(latLng(position).lat, latLng(position).lng)
  );
  let searchWord = $state("");
  const handleClickSearch = async () => {
    const res = await searchPlace(searchWord);
    if (res) {
      position = res;
      setPopupContent("You clicked the map at " + position.toString());
      leafletMap?.flyTo(position);
    } else {
      $toastSettings = {
        title: "Error",
        description: "Failed to find the specified location.",
        color: "bg-orange-500",
      };
    }
  };
  //https://github.com/penpenpng/imhere-nostr/blob/main/src/lib/nominatim.ts
  export interface Place {
    place_id: string;
    latLng: [number, number];
    geohash: string;
    name?: string;
    display_name?: string;
  }

  interface RawPlace {
    place_id: string;
    lat: string;
    lon: string;
    name: string;
    display_name: string;
  }

  /** https://nominatim.org/release-docs/latest/api/Search/ */
  async function searchPlace(q: string): Promise<LatLngExpression | null> {
    const xs = await get<RawPlace[]>(
      "https://nominatim.openstreetmap.org/search",
      {
        q,
        format: "jsonv2",
      }
    );
    console.log(xs);
    if (xs.length > 0) {
      const first = xs[0];
      return latLng(parseFloat(first.lat), parseFloat(first.lon));
    } else {
      return null;
    }
  }

  async function get<T = unknown>(
    url: string,
    query: Record<string, string>
  ): Promise<T> {
    const res = await fetch(`${url}?${new URLSearchParams(query)}`);
    return res.json();
  }
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
  <!-- 検索入力とボタン -->
  <div class="search-bar">
    <input
      class="search-input"
      type="text"
      placeholder="search word"
      bind:value={searchWord}
    />
    <button class="search-btn" onclick={handleClickSearch}><Search /></button>
  </div>
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
    @apply relative h-[480px] w-[640px] max-w-full rounded-md border border-blue-400 p-1;
  }
  .search-bar {
    @apply absolute bottom-2 left-2 flex items-center;
    z-index: 1000;
  }

  .search-input {
    @apply h-8 md:w-52 w-36 border rounded-l-md border-solid px-2 leading-none text-neutral-100 bg-neutral-900;
  }

  .search-btn {
    @apply h-8 px-3 rounded-r-md bg-blue-600 text-neutral-900 hover:bg-blue-700 active:bg-blue-800;
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
