<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import type { Token } from "markdown-it/index.js";

  interface Props {
    part: Token;
  }

  let { part }: Props = $props();

  // console.log("[image]", part);

  let view = $state(false);

  let src = $derived(part?.attrs?.find((attr) => attr[0] === "src")?.[1]);
  let alt = $derived(part?.attrs?.find((attr) => attr[0] === "alt")?.[1]);
  let title = $derived(part?.attrs?.find((attr) => attr[0] === "title")?.[1]);
  let button = $derived(
    `View Image${title && title !== "" ? title : alt && alt !== "" ? alt : ""}`
  );
  //$: console.log(part);

  let width = $derived(
    part.attrs?.find((tag) => tag[0] === "width")?.[1] ?? "288"
  );
  let height = $derived(
    part.attrs?.find((tag) => tag[0] === "height")?.[1] ?? "288"
  );
</script>

{#if lumiSetting.get().showImg || view}
  <img
    loading="lazy"
    {width}
    {height}
    class="overflow-hidden object-contain"
    style={`max-width:min(${width}px,100%);max-height:min(${height}px,100%)`}
    src={src ?? ""}
    alt={alt ?? ""}
    title={title && title !== "" ? title : alt && alt !== "" ? alt : src}
  />
{:else}
  <button
    class=" rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
    onclick={() => (view = true)}>{button}</button
  >{/if}
