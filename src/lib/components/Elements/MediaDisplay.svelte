<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { ChevronLeft, ChevronRight, X } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import type { Writable } from "svelte/store";

  interface Props {
    open: Writable<boolean>;
    images?: string[];
    currentIndex?: number;
  }
  let {
    open = $bindable(),
    images,
    currentIndex = $bindable(0),
  }: Props = $props();

  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open: dialogOpen },
  } = createDialog({
    forceVisible: true,
  });

  const goToNext = () => {
    if (images && images.length > 0) {
      currentIndex = (currentIndex + 1) % images.length;
    }
  };

  const goToPrev = () => {
    if (images && images.length > 0) {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
    }
  };

  open.subscribe((value: boolean) => {
    //  console.log(value);
    if (value) {
      $dialogOpen = true;
      $open = false;
    }
  });

  // dialogOpen?.subscribe((value: boolean) => {
  //   if (!value) {
  //     images = undefined;
  //   }
  // });
</script>

{#if $dialogOpen && images && images.length > 0}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[100vh] max-w-[100vw]
             -translate-x-1/2 -translate-y-1/2
            "
      use:melt={$content}
    >
      <!-- {#if images[currentIndex].type === "image"} -->
      <img
        alt=""
        src={images[currentIndex]}
        class="max-h-[100vh] max-w-[100vw] object-contain"
      />
      <!-- {:else if images[currentIndex].type === "movie"}<video
          controls
          src={images[currentIndex].content}
          class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        >
          <track default kind="captions" />
        </video>{:else if images[currentIndex].type === "audio"}<audio
          controls
          src={images[currentIndex].content}
          class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        >
          <track default kind="captions" />
        </audio>{/if} -->
    </div>
    {#if images && images.length > 1}
      <button
        use:melt={$content}
        class="fixed left-1 top-1/2 z-50 bg-neutral-100/75
            -translate-y-1/2 p-1 hover:bg-neutral-100 text-neutral-800 focus:shadow-neutral-400"
        onclick={goToPrev}><ChevronLeft /></button
      >

      <button
        use:melt={$content}
        class="fixed right-1 top-1/2 z-50 bg-neutral-100/75
            -translate-y-1/2 p-1 hover:bg-neutral-100 text-neutral-800 focus:shadow-neutral-400"
        onclick={goToNext}><ChevronRight /></button
      >{/if}

    <button
      use:melt={$close}
      aria-label="close"
      class="fixed z-50 right-4 top-4 inline-flex p-1appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800 bg-magnum-100/70
                hover:bg-magnum-100 focus:shadow-magnum-400"
    >
      <X />
    </button>
    <div
      class="fixed bottom-0 right-0 z-50 text-neutral-800 px-1 bg-neutral-100/50"
    >
      {currentIndex + 1}/{images?.length ?? 0}
    </div>
  </div>
{/if}
