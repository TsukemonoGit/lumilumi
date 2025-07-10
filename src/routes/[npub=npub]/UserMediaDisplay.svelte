<script lang="ts">
  import { useMediaPromiseReq } from "$lib/func/nostr";
  import * as Nostr from "nostr-typedef";
  import { onDestroy, onMount, untrack } from "svelte";
  import { writable, type Writable } from "svelte/store";

  import { type MediaEvent, type MediaResult } from "$lib/stores/operators";
  import Controls from "./Controls.svelte";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { formatAbsoluteDateFromUnix } from "$lib/func/util";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";

  // 定数
  const LOAD_LIMIT = 300;
  const MAX_RETRIES = 30;
  const MEDIA_PER_PAGE = 24;

  // EventCard用固定値
  const EVENT_CARD_CONFIG = {
    mini: false,
    depth: 0,
    repostable: true,
    zIndex: 50,
    maxHeight: undefined,
  };

  // 型定義
  type ImageLoadStatus = "loading" | "success" | "error";

  // Props
  let { pubkey }: { pubkey: string } = $props();

  // 状態管理
  let mediaEvents = $state<MediaEvent[]>([]);
  let isLoading = $state(false);
  let maxPage = $state<number | null>(null);
  let loadingProgress = $state<string>("");
  let page = $state(0);
  let oldestCreatedAt: number | null = null;
  let imageLoadStatus = $state<Record<string, ImageLoadStatus>>({});
  let isInitialized = $state(false);
  let selectedEvent = $state<MediaEvent | null>(null);
  let showModal: Writable<boolean> = $state(writable(false));
  let isCancelled = false;
  // 派生状態
  let viewList = $derived(
    mediaEvents.slice(page * MEDIA_PER_PAGE, (page + 1) * MEDIA_PER_PAGE)
  );

  // ユーティリティ関数
  const createFilter = (until?: number): Nostr.Filter => ({
    kinds: [1],
    authors: [pubkey],
    limit: LOAD_LIMIT,
    ...(until && { until }),
  });

  // 画像読み込み処理
  const handleImageLoad = (mediaUrl: string) => {
    imageLoadStatus[mediaUrl] = "success";
  };

  const handleImageError = (mediaUrl: string) => {
    imageLoadStatus[mediaUrl] = "error";
  };

  const initImageLoad = (mediaUrl: string) => {
    if (!imageLoadStatus[mediaUrl]) {
      imageLoadStatus[mediaUrl] = "loading";
    }
  };

  // モーダル処理
  const openModal = (media: MediaEvent) => {
    selectedEvent = media;
    $showModal = true;
  };

  // 初期化処理
  const loadInitialMedia = async () => {
    isInitialized = false;
    mediaEvents = [];
    oldestCreatedAt = null;
    maxPage = null;
    page = 0;
    isLoading = false;
    loadingProgress = "";
    imageLoadStatus = {};
    selectedEvent = null;
    showModal.set(false);
    isCancelled = false;
  };

  onMount(async () => {
    loadInitialMedia();
    await waitForConnections();
    isInitialized = true;
  });

  onDestroy(() => {
    isCancelled = true;
  });
  // 指定ページのデータを読み込み・切り替え
  $effect(() => {
    if (page >= 0 && isInitialized) {
      untrack(async () => {
        if (isLoading) return;

        // すでに表示可能な範囲にデータがあるか
        const startIndex = page * MEDIA_PER_PAGE;

        if (mediaEvents.length >= startIndex + MEDIA_PER_PAGE) {
          // 表示だけ切り替え
          //  console.log(page);
          return;
        }

        isLoading = true;

        try {
          // ループ前に元のデータをバックアップ
          const originalMediaEvents: MediaResult[] = [...mediaEvents];
          let finalNewMedia: MediaResult[] = [];

          let retryCount = 0;
          let currentUntil: number | undefined = oldestCreatedAt || undefined;

          while (retryCount < MAX_RETRIES && !isCancelled) {
            const filter = createFilter(currentUntil);

            const onData = (media: MediaResult) => {
              // 重複チェックしつつ一時的にUI用に追加
              if (!mediaEvents.some((m) => m.mediaUrl === media.mediaUrl)) {
                mediaEvents = [...mediaEvents, media].sort(
                  (a, b) =>
                    b.eventPacket.event.created_at -
                    a.eventPacket.event.created_at
                );
              }
            };

            const results = await useMediaPromiseReq(
              { filters: [filter] },
              undefined,
              2000,
              LOAD_LIMIT,
              onData
            );
            console.log(results);
            if (results.result.length > 0) {
              // 最終確定用に重複なく追加
              const newMedia = results.result.filter(
                (media) =>
                  !finalNewMedia.some((m) => m.mediaUrl === media.mediaUrl) &&
                  media.eventPacket.event.created_at >= results.oldestCreatedAt
              );
              finalNewMedia = [...finalNewMedia, ...newMedia];

              oldestCreatedAt = results.oldestCreatedAt;
              currentUntil = results.oldestCreatedAt;

              loadingProgress = `${mediaEvents.length}件のメディアを取得済み（試行回数: ${retryCount + 1}/${MAX_RETRIES}）`;
            }

            // 必要な件数に達したら終了
            if (
              finalNewMedia.length >=
              page * MEDIA_PER_PAGE + MEDIA_PER_PAGE
            ) {
              break;
            }

            // 最後のページ判定
            if (results.totalPacketsProcessed < LOAD_LIMIT) {
              maxPage = page;
              break;
            }

            retryCount++;
          }
          if (isCancelled) {
            loadInitialMedia();
            return;
          }
          // ループ終了後、元のデータ + 確定データで上書き（ソート済み）
          mediaEvents = [...originalMediaEvents, ...finalNewMedia].sort(
            (a, b) =>
              b.eventPacket.event.created_at - a.eventPacket.event.created_at
          );

          // ページ境界の oldestCreatedAt を保存

          // 最大試行回数に達したらページ末尾とみなす
          if (retryCount >= MAX_RETRIES) {
            maxPage = page;
          }

          // 取得データなしの場合の処理
          if (mediaEvents.length === 0) {
            maxPage = page;
            loadingProgress = "データがありません";
            setTimeout(() => {
              loadingProgress = "";
            }, 2000);
            return;
          }

          loadingProgress = `${mediaEvents.length}件のメディアを読み込み完了`;
          setTimeout(() => {
            loadingProgress = "";
          }, 1000);
        } catch (e) {
          console.error("Failed to load page:", e);
          maxPage = page;
          loadingProgress = "読み込みエラーが発生しました";
          setTimeout(() => {
            loadingProgress = "";
          }, 2000);
        } finally {
          isLoading = false;
        }
      });
    }
  });
</script>

<div class="media-gallery">
  <Controls bind:page {maxPage} {isLoading} {loadingProgress} />

  <div class="media-grid">
    {#each Array(MEDIA_PER_PAGE) as _, index}
      {@const media = viewList[index]}
      {#if media}
        <button class="media-item" onclick={() => openModal(media)}>
          <div
            class="absolute bottom-0 right-0 text-xs bg-neutral-900/50 px-1 rounded-sm"
          >
            {formatAbsoluteDateFromUnix(media.eventPacket.event.created_at)}
          </div>

          {#if media.mediaType === "image" || media.mediaType === "svg"}
            {#if imageLoadStatus[media.mediaUrl] === "error"}
              <div class="image-error-placeholder"></div>
            {:else}
              <img
                src={media.mediaUrl}
                alt=""
                loading="lazy"
                onload={() => handleImageLoad(media.mediaUrl)}
                onerror={() => handleImageError(media.mediaUrl)}
                onloadstart={() => initImageLoad(media.mediaUrl)}
                class:loading={imageLoadStatus[media.mediaUrl] === "loading"}
              />
              {#if imageLoadStatus[media.mediaUrl] === "loading"}
                <div class="image-loading-placeholder"></div>
              {/if}
            {/if}
          {:else if media.mediaType === "movie"}
            <video src={media.mediaUrl} muted preload="metadata">
              <track kind="captions" />
            </video>
            <div class="media-type-indicator">🎬</div>
          {:else if media.mediaType === "audio"}
            <div class="audio-placeholder">
              <span>🎵</span>
            </div>
          {:else if media.mediaType === "3D"}
            <div class="media-3d-placeholder">
              <span>🎲</span>
            </div>
          {/if}
        </button>
      {:else}
        <div class="media-item placeholder"></div>
      {/if}
    {/each}
  </div>

  <Controls bind:page {maxPage} {isLoading} {loadingProgress} />
</div>

<Dialog id={"showMore_preview"} bind:open={showModal} zIndex={10}>
  {#snippet main()}
    {#if selectedEvent?.eventPacket}
      <div class="rounded-md p-2 bg-zinc-800/40 w-full overflow-x-hidden">
        <Metadata
          queryKey={["metadata", selectedEvent.eventPacket.event.pubkey]}
          pubkey={selectedEvent.eventPacket.event.pubkey}
        >
          {#snippet loading()}
            <EventCard
              note={selectedEvent!.eventPacket.event}
              {...EVENT_CARD_CONFIG}
              showStatus={true}
              thread={false}
            />
          {/snippet}
          {#snippet nodata()}
            <EventCard
              note={selectedEvent!.eventPacket.event}
              {...EVENT_CARD_CONFIG}
              showStatus={true}
              thread={false}
            />
          {/snippet}
          {#snippet error()}
            <EventCard
              note={selectedEvent!.eventPacket.event}
              {...EVENT_CARD_CONFIG}
              showStatus={true}
              thread={false}
            />
          {/snippet}
          {#snippet content({ metadata })}
            <EventCard
              {metadata}
              note={selectedEvent!.eventPacket.event}
              {...EVENT_CARD_CONFIG}
              showStatus={true}
              thread={false}
            />
          {/snippet}
        </Metadata>
      </div>
    {/if}
  {/snippet}
</Dialog>

<style>
  .media-gallery {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .media-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
    background: theme("colors.neutral.800");
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .media-item.placeholder {
    cursor: default;
    background: theme("colors.neutral.800");
  }

  :global(.dark) .media-item {
    background: theme("colors.neutral.800");
  }

  :global(.dark) .media-item.placeholder {
    background: theme("colors.neutral.800");
  }

  .media-item img,
  .media-item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .media-item img.loading {
    opacity: 0;
  }

  .media-type-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .audio-placeholder,
  .media-3d-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 3rem;
    color: #666;
  }
</style>
