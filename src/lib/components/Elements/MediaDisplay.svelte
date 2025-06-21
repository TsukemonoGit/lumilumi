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

  interface MediaItem {
    url: string;
    originalIndex: number;
  }

  interface MediaViewState {
    imageUrls: string[];
    originalIndices: number[];
    currentIndex: number;
  }

  const DIALOG_ID = "mediaView";

  let {
    open = $bindable(),
    images = [],
    currentIndex = $bindable(0),
  }: Props = $props();

  // 状態管理
  let displayImages: MediaItem[] = $state([]);
  let displayIndex = $state(0); // displayImages配列内でのインデックス
  let isInitialized = $state(false);
  let loadingStatus: "loading" | "error" | "loaded" = $state("loading");

  // ダイアログ作成
  const { elements, states } = createDialog({ forceVisible: true });
  const { overlay, content, close, portalled } = elements;
  const { open: dialogOpen } = states;

  // 画像フィルタリング：表示可能な画像のみを抽出
  function filterValidImages(imageUrls: string[]): MediaItem[] {
    return imageUrls
      .map((url, index) => ({ url, originalIndex: index }))
      .filter((item) => {
        const data: UrlType | undefined = queryClient.getQueryData([
          "useUrl",
          item.url,
        ]);
        return data === undefined || data === "image";
      });
  }

  // 表示インデックスから元のインデックスへの変換
  function getOriginalIndex(): number {
    return displayImages[displayIndex]?.originalIndex ?? 0;
  }

  // 元のインデックスから表示インデックスへの変換
  function findDisplayIndex(originalIdx: number): number {
    const found = displayImages.findIndex(
      (img) => img.originalIndex === originalIdx
    );
    return found >= 0 ? found : 0;
  }

  // ナビゲーション
  function goToNext() {
    if (displayImages.length > 0) {
      displayIndex = (displayIndex + 1) % displayImages.length;
      currentIndex = getOriginalIndex();
    }
  }

  function goToPrev() {
    if (displayImages.length > 0) {
      displayIndex =
        (displayIndex - 1 + displayImages.length) % displayImages.length;
      currentIndex = getOriginalIndex();
    }
  }

  // 履歴状態作成
  function createDialogState(): App.PageState {
    if (displayImages.length === 0) return {};

    return {
      dialogOpen: {
        id: DIALOG_ID,
        mediaView: {
          imageUrls: displayImages.map((img) => img.url),
          originalIndices: displayImages.map((img) => img.originalIndex),
          currentIndex: getOriginalIndex(),
        },
      },
    };
  }

  // 履歴付きでダイアログを開く
  function openDialogWithHistory() {
    if (displayImages.length > 0) {
      const dialogState = createDialogState();
      pushState("", dialogState);
    }
  }

  // ダイアログを開く処理
  function openDialog(imageUrls: string[], targetIndex: number = 0) {
    displayImages = filterValidImages(imageUrls);

    if (displayImages.length === 0) return;

    displayIndex = findDisplayIndex(targetIndex);
    currentIndex = getOriginalIndex();
    $dialogOpen = true;

    // 初期化完了後のみ履歴操作
    if (isInitialized) {
      openDialogWithHistory();
    }
  }

  // ダイアログを閉じる処理
  function closeDialog() {
    $dialogOpen = false;
    $open = false;
    loadingStatus = "loading";
  }

  // 外部からの開く要求の処理
  $effect(() => {
    if ($open && images.length > 0) {
      untrack(() => {
        openDialog(images, currentIndex);
        $open = false;
      });
    }
  });

  // 初期化処理
  $effect(() => {
    if (isInitialized) return;

    isInitialized = true;

    // ページ状態からの復元
    const mediaViewState = page.state?.dialogOpen?.mediaView as MediaViewState;
    if (mediaViewState?.imageUrls?.length > 0) {
      untrack(() => {
        openDialog(mediaViewState.imageUrls, mediaViewState.currentIndex ?? 0);
      });
    }
  });

  // ブラウザバック処理
  $effect(() => {
    const shouldClose = $popStack?.[0]?.id === DIALOG_ID;

    if (shouldClose) {
      untrack(() => {
        closeDialog();
        popStack.update((stack) =>
          stack.filter((entry) => entry.id !== DIALOG_ID)
        );
      });
    }
  });

  // ページ状態変更監視
  $effect(() => {
    const currentDialogState = page.state?.dialogOpen?.id === DIALOG_ID;
    if ($dialogOpen && !currentDialogState) {
      untrack(() => closeDialog());
    }
  });

  // 画像変更時のロード状態リセット
  $effect(() => {
    if (displayImages.length > 0) {
      loadingStatus = "loading";
    }
  });

  // 現在の画像URL取得
  let currentImageUrl = $derived(displayImages[displayIndex]?.url ?? "");
</script>

{#if $dialogOpen && displayImages.length > 0}
  <div use:melt={$portalled} class="fixed inset-0 z-[999]">
    <!-- オーバーレイ -->
    <div
      use:melt={$overlay}
      class="fixed inset-0 bg-black/50"
      transition:fade={{ duration: 150 }}
    ></div>

    <div use:melt={$content}>
      <!-- 画像表示エリア -->
      <div
        class="fixed left-1/2 top-1/2 z-[999] max-h-[100vh] max-w-[100vw] -translate-x-1/2 -translate-y-1/2"
      >
        <div class="relative w-full h-full">
          <img
            src={currentImageUrl}
            alt=""
            class="max-h-[100vh] max-w-[100vw] object-contain"
            onload={() => (loadingStatus = "loaded")}
            onerror={() => (loadingStatus = "error")}
          />

          <!-- ローディング・エラー表示 -->
          {#if loadingStatus !== "loaded"}
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <span class="text-neutral-200 bg-black/50 px-2 py-1 rounded">
                {loadingStatus === "error" ? "error" : "loading..."}
              </span>
            </div>
          {/if}
        </div>
      </div>

      <!-- ナビゲーションボタン -->
      {#if displayImages.length > 1}
        <button
          class="fixed sm:left-4 left-1 top-1/2 z-[999] -translate-y-1/2 rounded-full bg-neutral-800/70 p-2 text-neutral-200 shadow-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onclick={goToPrev}
          aria-label="prev image"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          class="fixed sm:right-4 right-1 top-1/2 z-[999] -translate-y-1/2 rounded-full bg-neutral-800/70 p-2 text-neutral-200 shadow-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onclick={goToNext}
          aria-label="next image"
        >
          <ChevronRight size={24} />
        </button>
      {/if}
    </div>

    <!-- 閉じるボタン -->
    <button
      use:melt={$close}
      class="fixed sm:right-4 sm:top-4 right-2 top-2 z-[999] rounded-full bg-neutral-800/70 p-2 text-neutral-200 shadow-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="close"
    >
      <X size={24} />
    </button>

    <!-- 画像カウンター -->

    <div
      class="fixed bottom-1 right-1 z-[999] rounded bg-neutral-800/50 px-3 py-1 text-sm text-neutral-300"
    >
      {displayIndex + 1} / {displayImages.length}
    </div>
  </div>
{/if}
