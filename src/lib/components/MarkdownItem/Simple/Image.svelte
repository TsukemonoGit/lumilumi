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
</script>

{#if $showImg || view}
  <img
    loading="lazy"
    width="288"
    height="288"
    class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain"
    src={src ?? ""}
    alt={alt ?? ""}
    title={title && title !== "" ? title : alt && alt !== "" ? alt : src}
  />
{:else}
  <button
    class=" rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
    on:click={() => (view = true)}>{button}</button
  >{/if}
