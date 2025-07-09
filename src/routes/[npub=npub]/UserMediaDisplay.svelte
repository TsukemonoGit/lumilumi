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

  // ページごとの取得境界（until値）を保存
  let oldestCreatedAtByPage = new Map<number, number | null>();

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

  // 指定ページのデータを読み込み・切り替え
  $effect(() => {
    if (page >= 0) {
      untrack(async () => {
        if (isLoading) return;

        // すでに表示可能な範囲にデータがあるか
        const startIndex = page * MEDIA_PER_PAGE;
        console.log(
          startIndex,
          mediaEvents.length >= startIndex + MEDIA_PER_PAGE
        );
        if (mediaEvents.length >= startIndex + MEDIA_PER_PAGE) {
          // 表示だけ切り替え
          console.log(page);
          return;
        }

        isLoading = true;

        try {
          let retryCount = 0;
          let currentUntil: number | undefined;

          // 取得用untilを決める
          if (page === 0) {
            currentUntil = undefined;
          } else {
            currentUntil = oldestCreatedAt || undefined;
          }
          console.log(currentUntil);
          // 必要な件数に達するまで繰り返し取得
          while (retryCount < MAX_RETRIES) {
            const filter = createFilter(currentUntil);
            console.log(filter);
            const onData = (media: MediaResult) => {
              // id が既に存在するかチェック
              if (!mediaEvents.some((m) => m.mediaUrl === media.mediaUrl)) {
                mediaEvents = [...mediaEvents, media];
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
            // 取得したイベントを処理
            if (results.result.length > 0) {
              // mediaUrl が重複していないものだけ追加
              const newMedia = results.result.filter(
                (media) =>
                  !mediaEvents.some((m) => m.mediaUrl === media.mediaUrl)
              );

              // mediaEvents に追加
              mediaEvents = [...mediaEvents, ...newMedia].sort(
                (a, b) =>
                  a.eventPacket.event.created_at -
                  b.eventPacket.event.created_at
              );

              oldestCreatedAt = results.oldestCreatedAt;
              currentUntil = results.oldestCreatedAt;

              // 進捗メッセージを更新
              loadingProgress = `${mediaEvents.length}件のメディアを取得済み（試行回数: ${retryCount + 1}/${MAX_RETRIES}）`;
            }

            // 必要な件数に達した場合は終了
            if (mediaEvents.length >= page * MEDIA_PER_PAGE + MEDIA_PER_PAGE) {
              break;
            }

            // totalPacketsProcessedがLOAD_LIMITに達していない場合は最後のページ
            if (results.totalPacketsProcessed < LOAD_LIMIT) {
              maxPage = page;
              break;
            }

            retryCount++;
          }

          // ページ境界のcreated_atを保存
          if (oldestCreatedAt) {
            oldestCreatedAtByPage.set(page, oldestCreatedAt);
          }

          // 最大試行回数に達した場合
          if (retryCount >= MAX_RETRIES) {
            maxPage = page;
          }

          // 最終的にデータが取得できなかった場合
          if (mediaEvents.length === 0) {
            maxPage = page;
            loadingProgress = "データがありません";
            // メッセージを表示してから消す
            setTimeout(() => {
              loadingProgress = "";
            }, 2000);
            return;
          }

          loadingProgress = `${mediaEvents.length}件のメディアを読み込み完了`;

          // 完了メッセージを少し表示してから消す
          setTimeout(() => {
            loadingProgress = "";
          }, 1000);
        } catch (e) {
          console.error("Failed to load page:", e);
          maxPage = page;
          loadingProgress = "読み込みエラーが発生しました";
          // エラー時も少し表示してから消す
          setTimeout(() => {
            loadingProgress = "";
          }, 2000);
        } finally {
          isLoading = false;
        }
      });
    }
  });
  // 最初の読み込み
  const loadInitialMedia = async () => {
    mediaEvents = [];
    oldestCreatedAtByPage.clear();
    oldestCreatedAt = null;
    maxPage = null;
  };
  let selectedEvent = $state<MediaEvent | null>(null);
  let showModal: Writable<boolean> = writable(false);

  const openModal = (media: MediaEvent) => {
    selectedEvent = null;
    selectedEvent = media;
    $showModal = true;
  };

  onMount(() => {
    loadInitialMedia();
  });
</script>

<div class="media-gallery">
  <Controls bind:page {maxPage} {isLoading} {loadingProgress} />

  <div class="media-grid">
    {#each viewList as media, index (media.eventPacket.event.id + "-" + media.mediaUrl)}
      {#if media}
        <button class="media-item" onclick={() => openModal(media)}>
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
</style>
