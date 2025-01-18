<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import { Box, ExternalLink, ZoomIn } from "lucide-svelte";
  import loaderIcon from "$lib/assets/loader.svg";
  import { _ } from "svelte-i18n";
  import Dialog from "$lib/components/Elements/Dialog.svelte";

  import { type Writable, writable } from "svelte/store";

  interface Props {
    content?: string | undefined;
    url?: string | undefined;
  }

  // svelte-ignore non_reactive_update
  let { content = undefined, url = undefined }: Props = $props();
  let view = $state(false);

  // svelte-ignore non_reactive_update
  let showMore: Writable<boolean> = writable(false);
</script>

<img src={loaderIcon} alt="logo" />
{#if view}
  <div class="relative w-fit h-fit">
    <model-viewer
      style="width:18rem; height:18rem; "
      lazy={true}
      alt="3D"
      src={content ?? ""}
      ar
      poster={loaderIcon}
      shadow-intensity="1"
      camera-controls
      touch-action="pan-y"
    ></model-viewer>
    <div class="absolute bottom-0 right-0 flex flex-col gap-2">
      <!-- <Link
        props={{ "aria-label": `External Links: ${url}` }}
        className="text-magnum-300  hover:opacity-80"
        href={src ?? ""}>{#snippet content()}<ExternalLink />{/snippet}</Link
      > -->
      <button
        class="text-magnum-300 hover:opacity-80"
        onclick={() => ($showMore = true)}
      >
        <ZoomIn /></button
      >
    </div>
  </div>
{:else}
  <button
    class=" rounded-md border font-semibold border-magnum-600 text-magnum-200 px-2 py-4 m-1 hover:opacity-75 active:opacity-50 flex flex-col items-center"
    onclick={() => (view = true)}><Box size={42} />View 3D model</button
  >{/if}

<!--Show more no Dialog-->
<Dialog bind:open={showMore}>
  {#snippet main()}
    <div class="flex items-center justify-center overflow-hidden">
      <model-viewer
        style="width:90vw; height:74vh; max-width:560px"
        lazy={true}
        alt="3D"
        src={content ?? ""}
        ar
        poster={loaderIcon}
        shadow-intensity="1"
        camera-controls
        touch-action="pan-y"
      ></model-viewer>
    </div>
  {/snippet}</Dialog
>
