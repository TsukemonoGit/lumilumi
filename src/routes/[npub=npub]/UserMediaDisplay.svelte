<script lang="ts">
  import { useMediaPromiseReq } from "$lib/func/nostr";
  import * as Nostr from "nostr-typedef";
  import { onMount, untrack } from "svelte";

  import { type MediaEvent, type MediaResult } from "$lib/stores/operators";

  import Controls from "./Controls.svelte";
  import Dialog from "$lib/components/Elements/Dialog.svelte";

  import { writable, type Writable } from "svelte/store";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { formatAbsoluteDateFromUnix } from "$lib/func/util";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";

  let { pubkey }: { pubkey: string } = $props();

  let mediaEvents = $state<MediaEvent[]>([]);
  let isLoading = $state(false);
  let maxPage = $state<number | null>(null); // 最終ページ番号
  let loadingProgress = $state<string>("");
  const LOAD_LIMIT = 500;
  const MAX_RETRIES = 30;
  const mini = false;
  const depth = 0;

  const repostable = true;
  const zIndex = 50;
  const maxHeight = undefined;
  // ページ番号（0始まり）
  let page = $state(0);

  // 1ページあたりのメディア数
  const MEDIA_PER_PAGE = 24;

  // 初期取得の最古日時
  let oldestCreatedAt: number | null = null;

  let viewList = $derived(
    mediaEvents.slice(page * MEDIA_PER_PAGE, (page + 1) * MEDIA_PER_PAGE)
  );
  //$inspect(viewList);
  const createFilter = (until?: number): Nostr.Filter => {
    const filter: Nostr.Filter = {
      kinds: [1],
      authors: [pubkey],
      limit: LOAD_LIMIT,
    };
    if (until) {
      filter.until = until;
    }
    return filter;
  };
  let isInitialized = $state(false);

  // 指定ページのデータを読み込み・切り替え
  $effect(() => {
    if (page >= 0 && isInitialized) {
      untrack(async () => {
        if (isLoading) return;

        const startIndex = page * MEDIA_PER_PAGE;
        const requiredEndIndex = startIndex + MEDIA_PER_PAGE;

        // 既存データで表示可能な場合は処理終了
        if (mediaEvents.length >= requiredEndIndex) {
          return;
        }

        isLoading = true;

        try {
          const result = await loadMediaData(requiredEndIndex);

          if (result.success) {
            mediaEvents = result.mediaEvents;
            oldestCreatedAt = result.oldestCreatedAt || null;
            if (result.isLastPage) {
              maxPage = page;
            }
            showSuccessMessage(result.mediaEvents.length);
          } else {
            handleLoadError("データの読み込みに失敗しました");
          }
        } catch (e) {
          handleLoadError(e);
        } finally {
          isLoading = false;
        }
      });
    }
  });

  async function loadMediaData(requiredEndIndex: number) {
    const originalMediaEvents = [...mediaEvents];
    let finalNewMedia: any[] = [];
    let retryCount = 0;
    let currentUntil = oldestCreatedAt || undefined;

    while (retryCount < MAX_RETRIES) {
      const filter = createFilter(currentUntil);

      const onData = (media: MediaEvent) => {
        if (!mediaEvents.some((m) => m.mediaUrl === media.mediaUrl)) {
          mediaEvents = [...mediaEvents, media].sort(
            (a, b) =>
              b.eventPacket.event.created_at - a.eventPacket.event.created_at
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

      if (results.result.length > 0) {
        const newMedia = results.result.filter(
          (media) =>
            !finalNewMedia.some((m) => m.mediaUrl === media.mediaUrl) &&
            media.eventPacket.event.created_at >= results.oldestCreatedAt
        );

        finalNewMedia = [...finalNewMedia, ...newMedia];
        currentUntil = results.oldestCreatedAt;

        updateLoadingProgress(mediaEvents.length, retryCount + 1);
      }

      // 必要件数に達した場合は終了
      if (finalNewMedia.length >= requiredEndIndex) {
        break;
      }

      // 最後のページ判定
      if (results.totalPacketsProcessed < LOAD_LIMIT) {
        return {
          success: true,
          mediaEvents: [...originalMediaEvents, ...finalNewMedia].sort(
            (a, b) =>
              b.eventPacket.event.created_at - a.eventPacket.event.created_at
          ),
          oldestCreatedAt: results.oldestCreatedAt,
          isLastPage: true,
        };
      }

      retryCount++;
    }

    const sortedMediaEvents = [...originalMediaEvents, ...finalNewMedia].sort(
      (a, b) => b.eventPacket.event.created_at - a.eventPacket.event.created_at
    );

    return {
      success: true,
      mediaEvents: sortedMediaEvents,
      oldestCreatedAt: currentUntil,
      isLastPage: retryCount >= MAX_RETRIES || sortedMediaEvents.length === 0,
    };
  }

  function updateLoadingProgress(count: number, retryCount: number) {
    loadingProgress = `${count}件のメディアを取得済み（試行回数: ${retryCount}/${MAX_RETRIES}）`;
  }

  function showSuccessMessage(count: number) {
    if (count === 0) {
      loadingProgress = "データがありません";
    } else {
      loadingProgress = `${count}件のメディアを読み込み完了`;
    }

    setTimeout(
      () => {
        loadingProgress = "";
      },
      count === 0 ? 2000 : 1000
    );
  }

  function handleLoadError(error: unknown) {
    console.error("Failed to load page:", error);
    maxPage = page;
    loadingProgress = "読み込みエラーが発生しました";
    setTimeout(() => {
      loadingProgress = "";
    }, 2000);
  }

  // 最初の読み込み
  const loadInitialMedia = async () => {
    mediaEvents = [];
    oldestCreatedAt = null;
    maxPage = null;
  };
  let selectedEvent = $state<MediaEvent | null>(null);
  let showModal: Writable<boolean> = $state(writable(false));

  const openModal = (media: MediaEvent) => {
    selectedEvent = null;
    selectedEvent = media;
    $showModal = true;
  };

  onMount(async () => {
    loadInitialMedia();
    await waitForConnections();
    isInitialized = true;
  });
</script>

<div class="media-gallery">
  <Controls bind:page {maxPage} {isLoading} {loadingProgress} />

  <div class="media-grid">
    {#each viewList as media, index (media.eventPacket.event.id + "-" + media.mediaUrl)}
      {#if media}
        <button class="media-item" onclick={() => openModal(media)}
          ><div
            class="absolute bottom-0 right-0 text-xs bg-neutral-900/50 px-1 rounded-sm"
          >
            {formatAbsoluteDateFromUnix(media.eventPacket.event.created_at)}
          </div>
          {#if media.mediaType === "image" || media.mediaType === "svg"}
            <img src={media.mediaUrl} alt="" loading="lazy" />
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
      {/if}
    {/each}
  </div>
  <Controls bind:page {maxPage} {isLoading} {loadingProgress} />
</div>

<Dialog id={"showMore_preview"} bind:open={showModal} zIndex={10}>
  {#snippet main()}
    {#if selectedEvent?.eventPacket}
      <div class=" rounded-md p-2 bg-zinc-800/40 w-full overflow-x-hidden">
        <Metadata
          queryKey={["metadata", selectedEvent?.eventPacket.event.pubkey]}
          pubkey={selectedEvent?.eventPacket.event.pubkey}
        >
          {#snippet loading()}
            <EventCard
              note={selectedEvent!.eventPacket.event}
              {mini}
              showStatus={true}
              {maxHeight}
              thread={false}
              {depth}
              {repostable}
              {zIndex}
            />
          {/snippet}
          {#snippet nodata()}
            <EventCard
              note={selectedEvent!.eventPacket.event}
              {mini}
              showStatus={true}
              {maxHeight}
              thread={false}
              {depth}
              {repostable}
              {zIndex}
            />
          {/snippet}
          {#snippet error()}
            <EventCard
              note={selectedEvent!.eventPacket.event}
              {mini}
              showStatus={true}
              {maxHeight}
              thread={false}
              {depth}
              {repostable}
              {zIndex}
            />
          {/snippet}
          {#snippet content({ metadata })}
            <EventCard
              {metadata}
              note={selectedEvent!.eventPacket.event}
              {mini}
              showStatus={true}
              {maxHeight}
              thread={false}
              {depth}
              {repostable}
              {zIndex}
            />
          {/snippet}
        </Metadata>
      </div>
    {/if}
  {/snippet}</Dialog
>

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
    background: theme("colors.neutral.200");
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global(.dark) .media-item {
    background: theme("colors.neutral.800");
  }
  .media-item img,
  .media-item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
