<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { ChevronLeft, ChevronRight, X } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import type { Writable } from "svelte/store";
  import { popStack, queryClient } from "$lib/stores/stores";

  import { page } from "$app/state";
  import { pushState } from "$app/navigation";

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
  let displayImages: { url: string; originalIndex: number }[] = $state([]);

  let loadingStatus = $state("loading");

  const DIALOG_ID = "mediaView";

  const { elements, states } = createDialog({ forceVisible: true });
  const { trigger, overlay, content, close, portalled } = elements;
  const { open: dialogOpen } = states;

  let currentImage = $derived(
    displayImages.find((img) => img.originalIndex === currentIndex)
  );
  let currentImageIndex = $derived(
    displayImages.findIndex((img) => img.originalIndex === currentIndex)
  );

  // Navigation functions
  const goToNext = () => {
    if (displayImages.length > 0) {
      currentIndex = (currentIndex + 1) % displayImages.length;
    }
  };

  const goToPrev = () => {
    if (displayImages.length > 0) {
      currentIndex =
        (currentIndex - 1 + displayImages.length) % displayImages.length;
    }
  };

  // Filter images to ensure they're valid
  function filterValidImages(images: string[]) {
    return images
      .map((url, index) => ({ url, originalIndex: index }))
      .filter((item) => {
        const data = queryClient.getQueryData(["useUrl", item.url]);
        // kind20の場合はurlチェックしてないからundefined
        return data === undefined || data === "image";
      });
  }

  // Save dialog state to history
  function saveDialogState() {
    if ($state.snapshot(displayImages).length > 0) {
      const dialogState = {
        dialogOpen: {
          id: DIALOG_ID,
          mediaView: {
            imageUrls: displayImages.map((img) => img.url),
            originalIndices: displayImages.map((img) => img.originalIndex),
            currentIndex,
          },
        },
      };

      pushState("", dialogState);
    }
  }

  // Handle opening the dialog
  open.subscribe((value) => {
    if (value && images) {
      displayImages = filterValidImages(images);
      $dialogOpen = true;
      $open = false;

      saveDialogState();
    }
  });

  // Handle back navigation
  popStack.subscribe((value) => {
    const log = value.find((v) => v.id === DIALOG_ID);
    if (log) {
      $dialogOpen = false;
      $open = false;
      popStack.update((stack) => stack.filter((s) => s.id !== DIALOG_ID));
    }
  });
</script>

{page.state?.dialogOpen?.id}{displayImages.length}
{#if page.state?.dialogOpen?.id === DIALOG_ID && displayImages.length > 0}
  <div use:melt={$portalled}>
    <!-- Background overlay -->
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-[999] bg-black/50"
      transition:fade={{ duration: 150 }}
    ></div>

    <!-- Image container -->
    <div
      class="fixed left-1/2 top-1/2 z-[999] max-h-[100vh] max-w-[100vw] -translate-x-1/2 -translate-y-1/2"
      use:melt={$content}
    >
      <div class="relative w-full h-full">
        <img
          onload={() => (loadingStatus = "loaded")}
          onerror={() => (loadingStatus = "error")}
          alt=""
          src={$state.snapshot(currentImage)?.url}
          class="max-h-[100vh] max-w-[100vw] object-contain"
          loading="lazy"
        />

        {#if loadingStatus === "error" || loadingStatus === "loading"}
          <span class="absolute t-0 l-0 overflow-hidden">{loadingStatus}</span>
        {/if}
      </div>
    </div>

    <!-- Navigation buttons (only show if multiple images) -->
    {#if displayImages.length > 1}
      <div use:melt={$content}>
        <button
          class="fixed left-1 top-1/2 z-[999] bg-neutral-100/75 -translate-y-1/2 p-1 hover:bg-neutral-100 text-neutral-800 focus:shadow-neutral-400 w-fit"
          onclick={goToPrev}
        >
          <ChevronLeft />
        </button>

        <button
          class="fixed right-1 top-1/2 z-[999] bg-neutral-100/75 -translate-y-1/2 p-1 hover:bg-neutral-100 text-neutral-800 focus:shadow-neutral-400 w-fit"
          onclick={goToNext}
        >
          <ChevronRight />
        </button>
      </div>
    {/if}

    <!-- Close button -->
    <button
      use:melt={$close}
      aria-label="close"
      class="fixed z-[999] right-4 top-4 inline-flex p-1 appearance-none items-center justify-center rounded-full text-magnum-800 bg-magnum-100/70 hover:bg-magnum-100 focus:shadow-magnum-400"
    >
      <X />
    </button>

    <!-- Image counter -->
    <div
      class="fixed bottom-0 right-0 z-50 text-neutral-800 px-1 bg-neutral-100/50"
    >
      {#if displayImages.length > 0}
        {currentImageIndex + 1}/{displayImages.length}
      {/if}
    </div>
  </div>
{/if}
