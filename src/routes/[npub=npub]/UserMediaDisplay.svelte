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
  import {
    waitForConnections,
    waitForRelayReady,
  } from "$lib/components/renderSnippets/nostr/timelineList";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";

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
  let selectedEventIndex = $state<number | null>(null);
  let showModal: Writable<boolean> = $state(writable(false));
  let isCancelled = false;
  // 派生状態
  let viewList = $derived(
    mediaEvents.slice(page * MEDIA_PER_PAGE, (page + 1) * MEDIA_PER_PAGE),
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
  const openModal = (index: number) => {
    selectedEventIndex = index;
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
    selectedEventIndex = null;
    showModal.set(false);
    isCancelled = false;
  };

  onMount(async () => {
    loadInitialMedia();
    await waitForRelayReady({ maxWaitTime: 5000 }); // 最大5秒待つ
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

        const startIndex = page * MEDIA_PER_PAGE;

        if (mediaEvents.length >= startIndex + MEDIA_PER_PAGE) {
          // 表示だけ切り替え
          return;
        }

        isLoading = true;

        try {
          let retryCount = 0;
          let currentUntil: number | undefined = oldestCreatedAt || undefined;

          while (retryCount < MAX_RETRIES && !isCancelled) {
            const originalMediaEvents: MediaResult[] = [...mediaEvents];
            const filter = createFilter(currentUntil);

            const onData = (media: MediaResult) => {
              if (!mediaEvents.some((m) => m.mediaUrl === media.mediaUrl)) {
                mediaEvents = [...mediaEvents, media];
              }
            };

            const results = await useMediaPromiseReq(
              { filters: [filter] },
              undefined,
              5000,
              LOAD_LIMIT,
              onData,
            );

            // 重複排除して結合（mediaUrl ベースでユニークに）
            const merged = [...originalMediaEvents, ...results.result];
            const seen = new Set<string>();
            mediaEvents = merged
              .filter((m) => {
                if (seen.has(m.mediaUrl)) return false;
                seen.add(m.mediaUrl);
                return (
                  m.eventPacket.event.created_at >= results.oldestCreatedAt
                );
              })
              .sort(
                (a, b) =>
                  b.eventPacket.event.created_at -
                  a.eventPacket.event.created_at,
              );

            const previousOldestCreatedAt = oldestCreatedAt;
            oldestCreatedAt = results.oldestCreatedAt;
            currentUntil = results.oldestCreatedAt;

            loadingProgress = `${mediaEvents.length}件のメディアを取得済み（試行回数: ${retryCount + 1}/${MAX_RETRIES}）`;

            console.log(
              "page:",
              page,
              "required:",
              page * MEDIA_PER_PAGE + MEDIA_PER_PAGE,
              "mediaLen:",
              mediaEvents.length,
              "totalPackets:",
              results.totalPacketsProcessed,
            );

            // 必要な数に達したら終了
            if (mediaEvents.length >= page * MEDIA_PER_PAGE + MEDIA_PER_PAGE) {
              console.log("必要な数のメディアを取得完了");
              break;
            }

            // より確実な終了判定
            if (results.totalPacketsProcessed <= 0) {
              console.log("もうイベントないよ（新しいイベントが0個）");
              maxPage = page;
              break;
            }

            // 追加の安全チェック: oldestCreatedAtが変わらない場合
            if (
              previousOldestCreatedAt === results.oldestCreatedAt &&
              retryCount > 0
            ) {
              console.log("もうイベントないよ（時刻が進まない）");
              maxPage = page;
              break;
            }

            retryCount++;
          }

          if (isCancelled) return;

          if (retryCount >= MAX_RETRIES) {
            maxPage = page;
          }

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
      {#if viewList.length > index}
        {@const media = viewList[index]}

        {@const warning = media?.eventPacket?.event?.tags?.find(
          (tag) => tag[0] === "content-warning",
        )}
        {#if media}
          <button class="media-item" onclick={() => openModal(index)}>
            <div
              class="absolute bottom-0 right-0 text-xs bg-neutral-900/50 px-1 rounded-sm z-10"
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
                  class:blur-md={warning}
                />
                {#if imageLoadStatus[media.mediaUrl] === "loading"}
                  <div class="image-loading-placeholder"></div>
                {/if}
              {/if}
            {:else if media.mediaType === "movie"}
              <div class="relative w-full h-full">
                <video
                  src={media.mediaUrl}
                  muted
                  preload="metadata"
                  class:blur-md={warning}
                >
                  <track kind="captions" />
                </video>
                <div class="media-type-indicator">🎬</div>
              </div>
            {:else if media.mediaType === "audio"}
              <div class="audio-placeholder">
                <span>🎵</span>
              </div>
            {:else if media.mediaType === "3D"}
              <div class="media-3d-placeholder">
                <span>🎲</span>
              </div>
            {/if}

            {#if warning}
              <div class="warning-indicator">⚠️</div>
            {/if}
          </button>
        {:else}
          <div class="media-item placeholder"></div>
        {/if}{/if}
    {/each}
  </div>

  <Controls bind:page {maxPage} {isLoading} {loadingProgress} />
</div>
{#if selectedEventIndex !== null}
  <Dialog
    contentClass={"w-[1000px] max-w-[96vw] "}
    id={"showMore_preview"}
    bind:open={showModal}
    zIndex={10}
  >
    {#snippet main()}
      {#if selectedEventIndex! < viewList.length}
        {@const viewEvent = viewList[selectedEventIndex!].eventPacket.event}
        {#if viewEvent}
          <div class="rounded-md p-2 bg-zinc-800/40 w-full overflow-x-hidden">
            <Metadata
              queryKey={["metadata", viewEvent.pubkey]}
              pubkey={viewEvent.pubkey}
            >
              {#snippet loading()}
                <EventCard
                  note={viewEvent}
                  {...EVENT_CARD_CONFIG}
                  showStatus={true}
                  thread={false}
                />
              {/snippet}
              {#snippet nodata()}
                <EventCard
                  note={viewEvent}
                  {...EVENT_CARD_CONFIG}
                  showStatus={true}
                  thread={false}
                />
              {/snippet}
              {#snippet error()}
                <EventCard
                  note={viewEvent}
                  {...EVENT_CARD_CONFIG}
                  showStatus={true}
                  thread={false}
                />
              {/snippet}
              {#snippet content({ metadata })}
                <EventCard
                  {metadata}
                  note={viewEvent}
                  {...EVENT_CARD_CONFIG}
                  showStatus={true}
                  thread={false}
                />
              {/snippet}
            </Metadata>
          </div>
        {/if}
      {/if}
      <!-- ナビゲーションボタン -->
      {#if selectedEventIndex! >= 1}
        <button
          class="fixed sm:left-4 left-1 top-1/2 z-[999] -translate-y-1/2 rounded-full bg-neutral-800/70 p-2 text-neutral-200 shadow-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onclick={() => selectedEventIndex!--}
          aria-label="prev image"
        >
          <ChevronLeft size={24} />
        </button>
      {/if}
      {#if selectedEventIndex! < viewList.length - 1}
        <button
          class="fixed sm:right-4 right-1 top-1/2 z-[999] -translate-y-1/2 rounded-full bg-neutral-800/70 p-2 text-neutral-200 shadow-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onclick={() => selectedEventIndex!++}
          aria-label="next image"
        >
          <ChevronRight size={24} />
        </button>
      {/if}
    {/snippet}
  </Dialog>
{/if}

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
    width: 1.6em;
    height: 1.6em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
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

  .warning-indicator {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 4px;
    width: 1.6em;
    height: 1.6em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
