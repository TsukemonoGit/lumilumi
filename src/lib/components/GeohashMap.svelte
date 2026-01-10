<script lang="ts">
  import { MapPinCheck, MapPinPlus } from "lucide-svelte";
  import Dialog from "./Elements/Dialog.svelte";
  import { browser } from "$app/environment";
  import { addDebugLog } from "./Debug/debug";

  let { geohash = $bindable() } = $props();
  let dialogOpen = $state(false);

  const handleClickOpenMap = () => {
    dialogOpen = true;
  };

  const onClickSubmit = (geo: string) => {
    geohash = geo;
    addDebugLog(geo);
  };
  const onClickDelete = () => {
    geohash = "";
  };
</script>

<button aria-label="open map" onclick={handleClickOpenMap} class="button">
  {#if geohash}
    <MapPinCheck size="20" class={"stroke-magnum-500"} />
  {:else}
    <MapPinPlus size="20" class={"stroke-magnum-300"} />
  {/if}
</button>
<Dialog bind:open={dialogOpen} zIndex={9999} id="setGiohash"
  >{#snippet main()}
    <div class="p-2 w-full overflow-x-hidden flex-col justify-center gap-2">
      <div class="flex justify-center items-center gap-1 mb-1">
        <p class="text-sm font-medium">GEOHASH:</p>
        {#if geohash}
          <p
            class="inline font-mono bg-neutral-50 px-1 text-magnum-700 rounded"
          >
            {geohash}
          </p>
        {:else}
          <p class="inline text-sm italic">No location set</p>
        {/if}
      </div>
      {#if browser}
        {#await import("$lib/components/Sveaflet.svelte")}
          <div class="italic text-center pt-4 text-neutral-500">
            Loading map...
          </div>
        {:then module}
          {@const Sveaflet = module.default}
          <Sveaflet {onClickSubmit} {onClickDelete} initGeo={geohash} />
        {/await}
      {/if}
    </div>
  {/snippet}</Dialog
>

<style lang="postcss">
  .button {
    @apply inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-magnum-500
    bg-zinc-900 font-medium leading-none text-zinc-200 hover:opacity-75 active:opacity-50;
  }
</style>
