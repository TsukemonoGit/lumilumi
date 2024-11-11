<script lang="ts">
  import { showImg } from "$lib/stores/stores";
  import type { Token } from "markdown-it/index.js";

  export let part: Token;

  // console.log("[image]", part);

  let view = false;

  $: src = part?.attrs?.find((attr) => attr[0] === "src")?.[1];
  $: alt = part?.attrs?.find((attr) => attr[0] === "alt")?.[1];
  $: title = part?.attrs?.find((attr) => attr[0] === "title")?.[1];
  $: button = `View Image${title && title !== "" ? title : alt && alt !== "" ? alt : ""}`;
  //$: console.log(part);

  $: width = part.attrs?.find((tag) => tag[0] === "width")?.[1] ?? "288";
  $: height = part.attrs?.find((tag) => tag[0] === "height")?.[1] ?? "288";
</script>

<br />
{#if $showImg || view}
  <img
    loading="lazy"
    {width}
    {height}
    class="overflow-hidden object-contain inline"
    style={`max-width:min(${width}px,100%);max-height:min(${height}px,100%)`}
    src={src ?? ""}
    alt={alt ?? ""}
    title={title && title !== "" ? title : alt && alt !== "" ? alt : src}
  />
{:else}
  <button
    class=" rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
    on:click={() => (view = true)}>{button}</button
  >{/if}
