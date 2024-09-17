<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import type { Part } from "$lib/func/content";
  import { showImg } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";

  let imgError: boolean = false;
  let imgLoad: boolean = false;
  export let part: Part;
  export let openModal;
  let view = false;
</script>

{#if ($showImg && !imgError) || view}
  {#if !imgLoad}<Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all "
      href={part.url ?? ""}>{part.content}</Link
    >{/if}
  <div>
    <button
      class="w-fit h-fit"
      aria-label={$_("alia.label.image")}
      on:click={() => openModal(part.number ?? 0)}
      ><img
        loading="lazy"
        width="288"
        height="288"
        alt="img"
        src={part.content}
        class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain"
        on:load={() => (imgLoad = true)}
        on:error={() => (imgError = true)}
      /></button
    >
  </div>{:else}
  <button
    class=" rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
    on:click={() => (view = true)}>View Image</button
  >{/if}
