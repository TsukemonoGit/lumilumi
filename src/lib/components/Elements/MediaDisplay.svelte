<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { ChevronLeft, ChevronRight, X } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import type { Writable } from "svelte/store";
  import { popStack, queryClient } from "$lib/stores/stores";
  import type { UrlType } from "$lib/func/useUrl";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { untrack } from "svelte";

  interface Props {
    open: Writable<boolean>;
    images?: string[];
    currentIndex?: number;
  }

  const DIALOG_ID = "mediaView";

  let {
    open = $bindable(),
    images = [],
    currentIndex = $bindable(0),
  }: Props = $props();

  let displayImages: { url: string; originalIndex: number }[] = $state([]);
  let isInitialized = $state(false);
  let loadingStatus: "loading" | "error" | "loaded" = $state("loading");

  const { elements, states } = createDialog({ forceVisible: true });
  const { overlay, content, close, portalled } = elements;
  const { open: dialogOpen } = states;

  // 画像配列をチェックして表示可能なものだけをフィルタ
  function mediaCheck(images: string[]) {
    return images
      .map((url, index) => ({ url, originalIndex: index }))
      .filter((item) => {
        const data: UrlType | undefined = queryClient.getQueryData([
          "useUrl",
          item.url,
        ]);
        return data === undefined || data === "image";
      });
  }

  // ナビゲーション関数
  function goToNext() {
    if (displayImages.length > 0) {
      currentIndex = (currentIndex + 1) % displayImages.length;
    }
  }

  function goToPrev() {
    if (displayImages.length > 0) {
      currentIndex =
        (currentIndex - 1 + displayImages.length) % displayImages.length;
    }
  }

  // ダイアログの状態を作成
  function createDialogState(): App.PageState {
    if (displayImages.length > 0) {
      return {
        dialogOpen: {
          id: DIALOG_ID,
          mediaView: {
            imageUrls: displayImages.map((img) => img.url),
            originalIndices: displayImages.map((img) => img.originalIndex),
            currentIndex,
          },
        },
      };
    }
    return {};
  }

  // ダイアログを開く際に新しい履歴エントリを作成
  function openDialogWithHistory() {
    if (displayImages.length > 0) {
      const dialogState = createDialogState();
      pushState("", dialogState);
    }
  }

  // 外部からのダイアログを開く要求の処理
  $effect(() => {
    if ($open && images.length > 0) {
      untrack(() => {
        displayImages = mediaCheck(images);
        if (displayImages.length > 0) {
          $dialogOpen = true;
          $open = false;
          // 初期化完了後のみ履歴操作を行う
          if (isInitialized) {
            openDialogWithHistory();
          }
        }
      });
    }
  });

  // コンポーネント初期化時の処理
  $effect(() => {
    if (!isInitialized) {
      isInitialized = true;

      // 初期表示時にダイアログを開く必要があるか確認
      const mediaViewState = page.state?.dialogOpen?.mediaView;
      if (mediaViewState && mediaViewState.imageUrls?.length > 0) {
        untrack(() => {
          displayImages = mediaCheck(mediaViewState.imageUrls);

          // 元のインデックスも復元
          if (mediaViewState.originalIndices) {
            displayImages = displayImages.map((item, idx) => ({
              ...item,
              originalIndex: mediaViewState.originalIndices[idx] ?? idx,
            }));
          }

          currentIndex = mediaViewState.currentIndex ?? 0;
          $dialogOpen = true;
        });
      }
    }
  });

  // ブラウザバックなどでpopStackからナビゲーション変更があった場合
  $effect(() => {
    const logEntry = $popStack?.[0]?.id === DIALOG_ID;

    if (logEntry) {
      untrack(() => {
        $dialogOpen = false;
        $open = false;
        popStack.update((stack) =>
          stack.filter((entry) => entry.id !== DIALOG_ID)
        );
      });
    }
  });

  // 外部からのページ状態変更を監視
  $effect(() => {
    const currentDialogState = page.state?.dialogOpen?.id === DIALOG_ID;
    if ($dialogOpen && !currentDialogState) {
      untrack(() => {
        $dialogOpen = false;
      });
    }
  });

  // 画像変更時にロード状態をリセット
  $effect(() => {
    loadingStatus = "loading";
  });
</script>

{#if $dialogOpen && displayImages.length > 0}
  <div use:melt={$portalled}>
    <!-- オーバーレイ -->
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-[999] bg-black/50"
      transition:fade={{ duration: 150 }}
    ></div>
    <div use:melt={$content}>
      <!-- 画像表示エリア -->
      <div
        class="fixed left-1/2 top-1/2 z-[999] max-h-[100vh] max-w-[100vw] -translate-x-1/2 -translate-y-1/2"
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
          {#if loadingStatus === "error" || loadingStatus === "loading"}
            <span class="absolute t-0 l-0 overflow-hidden">{loadingStatus}</span
            >
          {/if}
        </div>
      </div>

      <!-- ナビゲーションボタン（複数画像の場合のみ表示） -->
      {#if displayImages.length > 1}
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
      {/if}
    </div>
    <!-- 閉じるボタン -->
    <button
      use:melt={$close}
      aria-label="close"
      class="fixed z-[999] right-4 top-4 inline-flex appearance-none items-center justify-center rounded-full p-1 text-magnum-800 bg-magnum-100/70 hover:bg-magnum-100 focus:shadow-magnum-400"
    >
      <X />
    </button>

    <!-- 画像カウンター -->
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
