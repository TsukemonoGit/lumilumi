<script lang="ts">
  import { usePromiseReq } from "$lib/func/nostr";
  import * as Nostr from "nostr-typedef";
  import { uniq, type EventPacket } from "rx-nostr";
  import { onMount } from "svelte";
  import { pipe } from "rxjs";
  import { userPromiseUrl } from "$lib/func/useUrl";
  import { urlRegex } from "$lib/func/regex";
  import { scanArray } from "$lib/stores/operators";

  let { pubkey }: { pubkey: string } = $props();

  const mediaTypes = ["image", "svg", "movie", "audio", "3D"] as const;
  type MediaType = (typeof mediaTypes)[number];

  interface MediaEvent {
    event: EventPacket;
    mediaUrl: string;
    mediaType: MediaType;
  }

  let mediaEvents = $state<MediaEvent[]>([]);
  let isLoading = $state(false);
  let hasMore = $state(true);

  // ページ番号（0始まり）
  let page = $state(0);

  // 1ページあたりのメディア数
  const MEDIA_PER_PAGE = 20;

  // ページごとの取得境界（until値）を保存
  let oldestCreatedAtByPage = new Map<number, number | null>();

  // 初期取得の最古日時
  let oldestCreatedAt: number | null = null;

  const createFilter = (until?: number): Nostr.Filter => {
    const filter: Nostr.Filter = {
      kinds: [1],
      authors: [pubkey],
      limit: 200,
    };
    if (until) {
      filter.until = until;
    }
    return filter;
  };

  const extractMediaUrls = (content: string): string[] => {
    const urls = content.match(urlRegex) || [];
    return urls.filter((url) => url.length > 0);
  };

  const processEvents = async (
    events: EventPacket[]
  ): Promise<MediaEvent[]> => {
    const results: MediaEvent[] = [];

    for (const event of events) {
      const urls = extractMediaUrls(event.event.content);
      for (const url of urls) {
        const mediaType = await userPromiseUrl(url);
        if (mediaType && mediaTypes.includes(mediaType as MediaType)) {
          results.push({
            event,
            mediaUrl: url,
            mediaType: mediaType as MediaType,
          });
        }
      }
    }
    return results;
  };

  // 指定ページのデータを読み込み・切り替え
  const loadPage = async (targetPage: number) => {
    if (targetPage < 0) return;
    if (isLoading) return;

    // すでに表示可能な範囲にデータがあるか
    const startIndex = targetPage * MEDIA_PER_PAGE;
    if (mediaEvents.length >= startIndex + MEDIA_PER_PAGE) {
      // 表示だけ切り替え
      page = targetPage;
      return;
    }

    isLoading = true;
    try {
      // 取得用untilを決める
      let until: number | undefined;
      if (targetPage === 0) {
        until = undefined;
      } else {
        until =
          oldestCreatedAtByPage.get(targetPage - 1) ??
          oldestCreatedAt ??
          undefined;
      }

      const filter = createFilter(until);
      const events = await usePromiseReq(
        { filters: [filter], operator: pipe(uniq(), scanArray()) },
        undefined,
        2000
      );

      if (events.length === 0) {
        hasMore = false;
        return;
      }

      const newMedia = await processEvents(events);
      const existingUrls = new Set(mediaEvents.map((m) => m.mediaUrl));
      const uniqueNewMedia = newMedia.filter(
        (m) => !existingUrls.has(m.mediaUrl)
      );

      if (uniqueNewMedia.length > 0) {
        mediaEvents = [...mediaEvents, ...uniqueNewMedia];
      }

      // ページ境界のcreated_atを保存
      const sortedEvents = events.sort(
        (a, b) => a.event.created_at - b.event.created_at
      );
      const oldest = sortedEvents[0].event.created_at - 1;
      oldestCreatedAtByPage.set(targetPage, oldest);
      oldestCreatedAt = oldest;

      if (events.length < 200) {
        hasMore = false;
      }

      page = targetPage;
    } catch (e) {
      console.error("Failed to load page:", e);
      hasMore = false;
    } finally {
      isLoading = false;
    }
  };

  // 最初の読み込み
  const loadInitialMedia = async () => {
    mediaEvents = [];
    oldestCreatedAtByPage.clear();
    oldestCreatedAt = null;
    hasMore = true;
    await loadPage(0);
  };

  const openModal = (media: MediaEvent) => {
    selectedEvent = media;
    showModal = true;
  };

  const closeModal = () => {
    showModal = false;
    selectedEvent = null;
  };

  let selectedEvent = $state<MediaEvent | null>(null);
  let showModal = $state(false);

  onMount(() => {
    loadInitialMedia();
  });
</script>

<div class="media-gallery">
  <div class="controls">
    <button
      class="btn"
      onclick={() => loadPage(0)}
      disabled={isLoading || page === 0}>TOP</button
    >
    <button
      class="btn"
      onclick={() => loadPage(page - 1)}
      disabled={isLoading || page === 0}>前のページ</button
    >
    <button
      class="btn"
      onclick={() => loadPage(page + 1)}
      disabled={isLoading || !hasMore}>次のページ</button
    >
  </div>

  <div class="media-grid">
    {#each mediaEvents.slice(page * MEDIA_PER_PAGE, (page + 1) * MEDIA_PER_PAGE) as media (media.event.event.id + "-" + media.mediaUrl)}
      <div class="media-item" onclick={() => openModal(media)}>
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
      </div>
    {/each}
  </div>

  {#if showModal && selectedEvent}
    <div class="modal-overlay" onclick={closeModal}>
      <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <button class="modal-close" onclick={closeModal}>×</button>

        <div class="modal-media">
          {#if selectedEvent.mediaType === "image" || selectedEvent.mediaType === "svg"}
            <img src={selectedEvent.mediaUrl} alt="" />
          {:else if selectedEvent.mediaType === "movie"}
            <video src={selectedEvent.mediaUrl} controls>
              <track kind="captions" />
            </video>
          {:else if selectedEvent.mediaType === "audio"}
            <audio src={selectedEvent.mediaUrl} controls></audio>
          {/if}
        </div>

        <div class="modal-info">
          <div class="event-content">{selectedEvent.event.event.content}</div>
          <div class="event-meta">
            <small>
              投稿日時: {new Date(
                selectedEvent.event.event.created_at * 1000
              ).toLocaleString()}
            </small>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* （省略）元のスタイルはそのまま使えます */
  .media-gallery {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .controls {
    margin-bottom: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    margin-right: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .media-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
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

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    position: relative;
  }

  .modal-close {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    z-index: 1001;
  }

  .modal-media {
    padding: 2rem;
    text-align: center;
  }

  .modal-media img,
  .modal-media video {
    max-width: 100%;
    max-height: 60vh;
  }

  .modal-info {
    padding: 1rem 2rem 2rem;
    border-top: 1px solid #eee;
  }

  .event-content {
    white-space: pre-wrap;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .event-meta {
    color: #666;
  }
</style>
