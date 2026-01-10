<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { popStack } from "$lib/stores/stores";
  import { userPromiseUrl, type UrlType } from "$lib/func/useUrl";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import CloseButton from "./CloseButton.svelte";

  interface Props {
    modalOpen: boolean;
    images?: string[];
    currentIndex?: number;
  }

  interface MediaItem {
    url: string;
    originalIndex: number;
    type: UrlType;
  }

  interface MediaViewState {
    imageUrls: string[];
    originalIndices: number[];
    currentIndex: number;
  }

  const DIALOG_ID = "mediaView";

  let {
    modalOpen = $bindable(),
    images = [],
    currentIndex = $bindable(0),
  }: Props = $props();

  // 状態管理
  let displayImages: MediaItem[] = $state([]);
  let displayIndex = $state(0); // displayImages配列内でのインデックス
  let isInitialized = $state(false);
  let loadingStatus: "loading" | "error" | "loaded" = $state("loading");

  // ダイアログの開閉状態
  let dialogOpen = $state(false);

  // 画像フィルタリング：表示可能な画像のみを抽出
  async function filterValidImages(imageUrls: string[]): Promise<MediaItem[]> {
    // 1. map でPromise配列を作る
    const itemsWithType = await Promise.all(
      imageUrls.map(async (url, index) => {
        //console.log(url);
        const data: UrlType | null = await userPromiseUrl(url);
        return { url, originalIndex: index, type: data || "url" };
      })
    );

    // 2. フィルター
    const filtered = itemsWithType.filter((item) => {
      // console.log(item);
      return item.type === "image" || item.type === "svg";
    });

    return filtered;
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
  async function openDialog(imageUrls: string[], targetIndex: number = 0) {
    displayImages = await filterValidImages(imageUrls);

    if (displayImages.length === 0) return;

    displayIndex = findDisplayIndex(targetIndex);
    currentIndex = getOriginalIndex();
    dialogOpen = true;

    // 初期化完了後のみ履歴操作
    if (isInitialized) {
      openDialogWithHistory();
    }
  }

  // ダイアログを閉じる処理
  function closeDialog() {
    dialogOpen = false;
    modalOpen = false;
    loadingStatus = "loading";
  }

  // 外部からの開く要求の処理
  $effect(() => {
    if (modalOpen && images.length > 0) {
      untrack(() => {
        openDialog(images, currentIndex);
        modalOpen = false;
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
    if (dialogOpen && !currentDialogState) {
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
  let currentImageType = $derived(displayImages[displayIndex]?.type ?? "image");
</script>

<DialogPrimitive.Root
  bind:open={dialogOpen}
  onOpenChange={(value) => {
    if (!value) {
      popStack.update((stack) =>
        stack.filter((entry) => entry.id !== DIALOG_ID)
      );
    }
  }}
>
  {#if dialogOpen && displayImages.length > 0}
    <DialogPrimitive.Portal>
      <!-- オーバーレイ -->
      <DialogPrimitive.Overlay
        class="fixed inset-0 bg-black/50"
        style="z-index:999"
      />

      <DialogPrimitive.Content class="fixed inset-0" style="z-index:999">
        <!-- 画像表示エリア -->
        <div
          class="fixed left-1/2 top-1/2 max-h-[100vh] max-w-[100vw] -translate-x-1/2 -translate-y-1/2"
        >
          <div class="relative w-full h-full">
            {#if currentImageType === "svg"}
              <!-- SVG専用の表示 -->
              <div
                class="flex items-center justify-center max-h-[100vh] max-w-[100vw]"
              >
                <img
                  src={currentImageUrl}
                  alt=""
                  class="h-[100vh] w-[100vh] object-contain"
                  onload={() => (loadingStatus = "loaded")}
                  onerror={() => (loadingStatus = "error")}
                />
              </div>
            {:else}
              <!-- 通常の画像表示 -->
              <img
                src={currentImageUrl}
                alt=""
                class="max-h-[100vh] max-w-[100vw] object-contain"
                onload={() => (loadingStatus = "loaded")}
                onerror={() => (loadingStatus = "error")}
              />
            {/if}

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
            class="fixed sm:left-4 left-1 top-1/2 -translate-y-1/2 rounded-full bg-neutral-800/70 p-2 text-neutral-200 shadow-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="z-index:999"
            onclick={goToPrev}
            aria-label="prev image"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            class="fixed sm:right-4 right-1 top-1/2 -translate-y-1/2 rounded-full bg-neutral-800/70 p-2 text-neutral-200 shadow-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="z-index:999"
            onclick={goToNext}
            aria-label="next image"
          >
            <ChevronRight size={24} />
          </button>
        {/if}

        <!-- 閉じるボタン -->
        <CloseButton
          onclick={() => (dialogOpen = false)}
          ariaLabel="close"
          zIndex={999}
        />

        <!-- 画像カウンター -->
        <div
          class="fixed bottom-1 right-1 rounded bg-neutral-800/50 px-3 py-1 text-sm text-neutral-300"
          style="z-index:999"
        >
          {displayIndex + 1} / {displayImages.length}
          {#if currentImageType === "svg"}
            <span class="ml-1 text-xs opacity-75">SVG</span>
          {/if}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  {/if}
</DialogPrimitive.Root>
