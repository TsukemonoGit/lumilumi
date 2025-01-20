<!--ContentImage.svelte-->
<script lang="ts">
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import Link from "$lib/components/Elements/Link.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { _ } from "svelte-i18n";
  import { writable, type Writable } from "svelte/store";

  let imgError: boolean = $state(false);
  let imgLoad: boolean = $state(false);
  interface Props {
    url: string;
  }

  let { url }: Props = $props();
  let view = $state(false);

  //svelte-ignore non_reactive_update
  let showImage: Writable<boolean> = writable(false);
</script>

{#if (lumiSetting.get().showImg && !imgError) || view}
  {#if !imgLoad}<Link
      props={{ "aria-label": `External Links: ${url}` }}
      className="underline text-magnum-300 break-all "
      href={url}>{#snippet content()}{url}{/snippet}</Link
    >{/if}
  <div>
    <button
      class="w-fit h-fit"
      aria-label={$_("alia.label.image")}
      onclick={() => ($showImage = true)}
      ><img
        loading="lazy"
        width="288"
        height="200"
        alt="img"
        src={url}
        class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain"
        onload={() => (imgLoad = true)}
        onerror={() => (imgError = true)}
      /></button
    >
  </div>{:else if imgError}
  <Link
    props={{ "aria-label": `External Links: ${url}` }}
    className="underline text-magnum-300 break-all "
    href={url}>{#snippet content()}{url}{/snippet}</Link
  >{:else}
  <button
    class=" rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
    onclick={() => (view = true)}>View Image</button
  >{/if}

<!--Show more no Dialog-->
<Dialog bind:open={showImage}>
  {#snippet main()}
    <div class="w-full h-full overflow-hidden">
      <img
        alt=""
        src={url}
        class="max-h-[100vh] max-w-[100vw] w-full h-full object-contain"
      />
    </div>
  {/snippet}</Dialog
>
