<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { ChevronLeft, ChevronRight, X } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import type { Writable } from "svelte/store";
  import { queryClient } from "$lib/stores/stores";
  import type { UrlType } from "$lib/func/useUrl";
  import { goto, pushState } from "$app/navigation";
  import { page } from "$app/state";

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

  const { elements, states } = createDialog({ forceVisible: true });
  const { trigger, overlay, content, close, portalled } = elements;
  const { open: dialogOpen } = states;

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

  open.subscribe((value: boolean) => {
    if (value && images) {
      displayImages = mediaCheck(images);
      $dialogOpen = true;
      $open = false;

      // 現在のパスに対してstateを追加
      const currentPath = page.url.pathname;
      pushState(currentPath, {
        state: {
          mediaView: {
            imageUrls: displayImages.map((img) => img.url),
            originalIndices: displayImages.map((img) => img.originalIndex),
            currentIndex,
          },
          replaceState: true,
        },
      });
    }
  });

  const handlePopState = (event: PopStateEvent) => {
    // SvelteKitの履歴状態から mediaView を取得
    const mediaView = event.state?.["sveltekit:states"]?.state?.mediaView;

    if (mediaView) {
      displayImages = mediaCheck(mediaView.imageUrls.map((url: string) => url));
      currentIndex = mediaView.currentIndex;
      $dialogOpen = true;
    } else {
      $dialogOpen = false;
    }
  };

  let loadingStatus: "loading" | "error" | "loaded" = $state("loading");
  function mediaCheck(images: string[]) {
    return images
      .map((url, index) => ({ url, originalIndex: index }))
      .filter((item) => {
        const data: UrlType | undefined = queryClient.getQueryData([
          "useUrl",
          item.url,
        ]);
        //kind20の場合はurlチェックしてないからundefined
        return data === undefined || data === "image";
      });
  }
</script>

<svelte:window onpopstate={handlePopState} />
{#if $dialogOpen && displayImages.length > 0}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-[999] bg-black/50"
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class="fixed left-1/2 top-1/2 z-[999] max-h-[100vh] max-w-[100vw]
             -translate-x-1/2 -translate-y-1/2"
      use:melt={$content}
    >
      <div class="relative w-full h-full">
        <img
          onload={() => (loadingStatus = "loaded")}
          onerror={() => (loadingStatus = "error")}
          alt=""
          src={$state.snapshot(
            displayImages.find((img) => img.originalIndex === currentIndex)
          )?.url}
          class="max-h-[100vh] max-w-[100vw] object-contain"
        />
        <!--もしかしたら画像じゃないやつもあるかもしれないし-->
        {#if loadingStatus === "error" || loadingStatus === "loading"}
          <span class="absolute t-0 l-0 overflow-hidden">{loadingStatus}</span
          >{/if}
      </div>
    </div>
    {#if displayImages.length > 1}
      <div use:melt={$content}>
        <button
          class="fixed left-1 top-1/2 z-[999] bg-neutral-100/75
        -translate-y-1/2 p-1 hover:bg-neutral-100 text-neutral-800 focus:shadow-neutral-400 w-fit"
          onclick={goToPrev}><ChevronLeft /></button
        >
        <button
          class="fixed right-1 top-1/2 z-[999] bg-neutral-100/75
            -translate-y-1/2 p-1 hover:bg-neutral-100 text-neutral-800 focus:shadow-neutral-400 w-fit"
          onclick={goToNext}><ChevronRight /></button
        >
      </div>
    {/if}
    <button
      use:melt={$close}
      aria-label="close"
      class="fixed z-[999] right-4 top-4 inline-flex p-1appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800 bg-magnum-100/70
                hover:bg-magnum-100 focus:shadow-magnum-400"
    >
      <X />
    </button>
    <div
      class="fixed bottom-0 right-0 z-50 text-neutral-800 px-1 bg-neutral-100/50"
    >
      {#if displayImages.length > 0}
        {displayImages.findIndex((img) => img.originalIndex === currentIndex) +
          1}/{displayImages.length}
      {/if}
    </div>
  </div>
{/if}
