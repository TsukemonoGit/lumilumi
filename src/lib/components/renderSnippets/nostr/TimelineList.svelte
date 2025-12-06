<!--
  メインTL以外のタイムラインコンポーネント
  （グローバルTL、リストTL、ユーザーページのTLなど）
-->
<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import {
    nowProgress,
    queryClient,
    tie,
  } from "$lib/stores/stores";
  import { useTimelineEventList } from "$lib/stores/useTimelineEventList";
  import type { ReqStatus } from "$lib/types";
  import { type QueryKey, createQuery } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";
  import {
    firstLoadOlderEvents,
    loadOlderEvents,
    waitForConnections,
  } from "./timelineList";
  import { now, type EventPacket } from "rx-nostr";
  import Metadata from "./Metadata.svelte";
  import { onDestroy, onMount, untrack, type Snippet } from "svelte";
  import { pipe } from "rxjs";
  import { /* createUniq , */ uniq } from "rx-nostr/src";
  import {
    displayEvents,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import { scanArray } from "$lib/stores/operators";
  import { sortEventPackets } from "$lib/func/util";
  import { page } from "$app/state";

  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    olderFilters: Nostr.Filter[];
    req?: any;
    viewIndex?: number;
    amount: number;
    relays?: string[] | undefined;

    eventFilter?: (event: Nostr.Event) => boolean;
    error?: Snippet<[Error]>;
    nodata?: Snippet;
    loading?: Snippet;
    content?: Snippet<
      [{ events: Nostr.Event<number>[]; status: ReqStatus; len: number }]
    >;
    resetUniq?: () => void;
  }
  // タイムライン設定定数
  const CONFIG = {
    SLIDE_AMOUNT: 40, // 一度に移動するイベント数
    UPDATE_DELAY: 20, // ビュー更新の遅延時間（ms）
    LOAD_LIMIT: 50, // 一度に読み込むイベント数
    FUTURE_EVENT_TOLERANCE: 10, // 未来のイベントを許容する秒数
    SCROLL_ADJUSTMENT: 120, // スクロール位置調整のピクセル数
    SCROLL_DELAY: 100, // スクロール後の更新遅延時間（ms）
    INIT_UPDATE_DELAY: 10, // 初期化後の更新遅延時間（ms）
  };

  let {
    queryKey,
    filters,
    olderFilters,
    req,
    viewIndex = 0,
    amount,
    relays = undefined,

    eventFilter = () => true,
    error,
    loading,
    nodata,
    content,
    resetUniq = $bindable(),
  }: Props = $props();

  // State management
  let allUniqueEvents: Nostr.Event[] = $state([]);
  let updating = $state(false);
  let timeoutId: NodeJS.Timeout | null = null;
  let isOnMount = $state(false);
  let isLoadingOlderEvents = $state(false);
  let isUpdateScheduled = $state(false);
  let destroyed = $state(false);
  let currentEventCount = $state(0);
  let initRunning = $state(false);

  /**
   * タイムラインの更新状態をリセット
   */
  function resetTimeline() {
    updating = false;
    isUpdateScheduled = false;
    $nowProgress = false;
  }

  /**
   * タイムラインの全状態をリセット（コンポーネント破棄時やユーザー変更時など）
   */
  function fullResetTimeline() {
    allUniqueEvents = [];
    timeoutId = null;
    isOnMount = false;
    isLoadingOlderEvents = false;
    destroyed = false;
    currentEventCount = 0;
    initRunning = false;
    resetTimeline();
  }

  /**
   * 現在のイベント数を更新
   */
  function updateCounts() {
    currentEventCount = allUniqueEvents.length;
  }

  /**
   * タイムライン更新用のタイムアウトをクリア
   */
  function clearTimelineTimeout() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  /**
   * ユーザーIDが変更された時にタイムラインをリセット
   */
  $effect(() => {
    if (page.params.npub) {
      fullResetTimeline();
    }
  });

  const configureOperators = pipe(tie, uniq(), scanArray());

  let olderQueryKey = $derived([...queryKey, "olderData"]);

  /**
   * コンポーネント破棄時のクリーンアップ
   */
  onDestroy(() => {
    destroyed = true;
    clearTimelineTimeout();
    fullResetTimeline();
  });

  /**
   * 古いイベントデータ用のクエリを作成
   * キャッシュとして使用するため、自動リフェッチは無効
   */
  $effect(() => {
    createQuery({
      queryKey: olderQueryKey,
      queryFn: undefined,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });
  });

  // Create the timeline event list
  let result = useTimelineEventList(
    queryKey,
    filters,
    configureOperators,
    req,
    relays
  );
  let globalData = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);

  let loadMoreDisabled = $state(false);
  // Update the view with current events

  /**
   * ビュー更新をスケジュール
   * 既にスケジュール済みの場合は何もしない
   * @param partialdata 追加でマージするイベントデータ（オプション）
   */
  const updateViewEvent = (partialdata?: EventPacket[] | null | undefined) => {
    if (isUpdateScheduled) return;

    isUpdateScheduled = true;

    if (!updating) {
      scheduleUpdate(partialdata || []);
    }
  };

  /**
   * 更新処理を遅延実行するためのタイムアウトを設定
   * コンポーネントが破棄されている場合は処理を中断
   * @param partialdata 追加でマージするイベントデータ（オプション）
   */
  function scheduleUpdate(partialdata?: EventPacket[]) {
    clearTimelineTimeout();

    timeoutId = setTimeout(() => {
      if (destroyed) {
        resetTimeline();
        return;
      }
      processUpdate(partialdata);
    }, CONFIG.UPDATE_DELAY);
  }
  /**
   * イベントの重複排除とマージ
   * current と older は既に重複がない前提で、partial との重複のみチェック
   * @param current 現在のイベントデータ
   * @param older 古いイベントデータ
   * @param partial 追加でマージするイベントデータ（重複チェック対象）
   * @returns マージされたイベント配列
   */
  function mergeEvents(
    current: EventPacket[] | null | undefined,
    older: EventPacket[] | undefined,
    partial: EventPacket[] | undefined
  ): EventPacket[] {
    // partialがない場合は単純結合（重複チェック不要）
    if (!partial || partial.length === 0) {
      return [...(current || []), ...(older || [])];
    }

    // partialがある場合のみ重複チェック
    const existingIds = new Set<string>();
    const result: EventPacket[] = [];

    // current, olderを先に追加（重複なし前提）
    [...(current || []), ...(older || [])].forEach((pk) => {
      existingIds.add(pk.event.id);
      result.push(pk);
    });

    // partialから重複していないもののみ追加
    partial.forEach((pk) => {
      if (!existingIds.has(pk.event.id)) {
        result.push(pk);
      }
    });

    return result;
  }

  /**
   * タイムラインの更新処理を実行
   * イベントをマージ、フィルタリング、表示範囲を計算して表示イベントを更新
   * @param partialdata 追加でマージするイベントデータ（オプション）
   */
  function processUpdate(partialdata?: EventPacket[]) {
    try {
      updating = true;

      // キャッシュから古いイベントを取得
      const olderEvents: EventPacket[] | undefined = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]);

      // イベントをマージ
      const allEvents = mergeEvents($globalData, olderEvents, partialdata);

      // フィルタリング: イベントフィルタと未来のイベントを除外
      allUniqueEvents = allEvents
        .map((event) => event.event)
        .filter(eventFilter)
        .filter(
          (event) => event.created_at <= now() + CONFIG.FUTURE_EVENT_TOLERANCE
        );

      // 表示範囲を計算
      const startIndex = Math.max(0, viewIndex);
      const endIndex = startIndex + amount;

      // 表示イベントを更新
      displayEvents.set(
        allUniqueEvents.slice(startIndex, endIndex)
      );

      isUpdateScheduled = false;
    } catch (error) {
      console.error("Error during update", error);
      isUpdateScheduled = false;
    } finally {
      updating = false;
      updateCounts();

      // 更新がスケジュールされている場合は再実行
      if (isUpdateScheduled) {
        scheduleUpdate();
      }
    }
  }

  /**
   * グローバルデータやviewIndexが変更された時にビューを更新
   */
  $effect(() => {
    if (($globalData && viewIndex >= 0) || !$nowProgress) {
      untrack(() => updateViewEvent());
    }
  });

  /**
   * インクリメンタルデータ受信時のハンドラを作成
   * 部分的なデータが到着した際にビューを更新する
   */
  function createIncrementalHandler() {
    return (partialData: EventPacket[]) => {
      if (partialData.length === 0) return;
      updateViewEvent(partialData);
    };
  }

  /**
   * コンポーネントの初期化
   * 既存のキャッシュがない場合、古いイベントを読み込む
   */
  async function init() {
    if (initRunning) return;
    initRunning = true;
    $nowProgress = true;
    updating = false;
    const existingEvents: EventPacket[] | undefined =
      queryClient.getQueryData(olderQueryKey);

    if (!existingEvents || existingEvents.length <= 0) {
      // フィルタを準備: sinceを削除し、untilを設定
      const newFilters: Nostr.Filter[] = olderFilters.map((filter) => ({
        ...filter,
        since: undefined,
        until:
          filters[0].until === undefined
            ? (filter.since ?? now())
            : filter.until,
        limit: CONFIG.LOAD_LIMIT,
      }));
      isLoadingOlderEvents = true;

      // リレー接続を待機
      await waitForConnections();
      const handleIncrementalData = createIncrementalHandler();

      // 古いイベントを読み込み
      const olderEvents = await firstLoadOlderEvents(
        CONFIG.LOAD_LIMIT,
        newFilters,
        configureOperators,
        relays,
        handleIncrementalData
      );

      if (olderEvents.length > 0) {
        // グローバルデータに既に存在するIDを除外して重複を防ぐ
        const existingIds = new Set(
          ($globalData ?? []).map((p) => p.event.id)
        );
        const filtered = olderEvents.filter(
          (p) => !existingIds.has(p.event.id)
        );

        // キャッシュに保存
        queryClient.setQueryData([...queryKey, "olderData"], () => filtered);

        // 少し遅延してからビューを更新
        setTimeout(() => {
          updateViewEvent?.($globalData);
          isLoadingOlderEvents = false;
        }, CONFIG.INIT_UPDATE_DELAY);
      }
    }
    $nowProgress = false;
    initRunning = false;
  }

  /**
   * コンポーネントマウント時の初期化
   */
  onMount(async () => {
    isOnMount = true;
    await init();
  });

  /**
   * ナビゲーション後の初期化
   * フォーム送信以外のナビゲーションで、まだ初期化されていない場合のみ実行
   */
  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      await init();
    }
  });

  const fetchAmount = CONFIG.LOAD_LIMIT * 5;

  /**
   * 「Load more」ボタンがクリックされた時の処理
   * 十分なイベントがある場合は表示位置を移動、不足している場合は古いイベントを読み込む
   */
  const handleNext = async () => {
    if ($nowProgress) return;

    let viewMoved = false;

    try {
      // 十分なイベントがある場合は表示位置を移動するだけ
      const hasEnoughStock =
        currentEventCount >=
        viewIndex + amount + CONFIG.SLIDE_AMOUNT;

      if (hasEnoughStock) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
        updateViewEvent();
        return;
      }

      // 既に読み込み中の場合は何もしない
      if (isLoadingOlderEvents) {
        return;
      }

      // 最後のイベントのタイムスタンプを取得（untilTimeとして使用）
      const untilTime =
        allUniqueEvents?.[
          allUniqueEvents.length - 1
        ]?.created_at;

      if (!untilTime) {
        console.warn("No existing events to determine untilTime");
        return;
      }

      isLoadingOlderEvents = true;

      // sinceを削除したフィルタを作成
      const filtersWithoutSince = olderFilters.map((filter) => ({
        ...filter,
        since: undefined,
      }));

      // 古いイベントを読み込み
      const olderEvents = await loadOlderEvents(
        fetchAmount,
        filtersWithoutSince,
        untilTime,
        configureOperators,
        relays,
        (partialData) => {
          if (partialData.length === 0) return;

          updateCounts();
          // まだ十分でない場合は表示位置を移動
          const stillNotEnough =
            currentEventCount <
            viewIndex + amount + CONFIG.SLIDE_AMOUNT + 10; // 重複考慮のマージン

          if (!viewMoved && !stillNotEnough) {
            viewIndex += CONFIG.SLIDE_AMOUNT;
            viewMoved = true;
          }

          updateViewEvent(partialData);
        }
      );

      // 読み込んだイベントをキャッシュに保存
      if (olderEvents.length > 0) {
        updateQueryDataForOlder(olderEvents);
      }

      updateCounts();

      // 読み込んだイベントが少なく、まだ十分でない場合は「Load more」を無効化
      if (
        !viewMoved &&
        olderEvents.length < fetchAmount &&
        currentEventCount <
          viewIndex + amount + CONFIG.SLIDE_AMOUNT
      ) {
        loadMoreDisabled = true;
      }

      // 最後のチェック: 次のページのイベントが少しでもあったら移動
      if (
        !viewMoved &&
        currentEventCount > viewIndex + amount
      ) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
      }
    } catch (error) {
      console.error("loadOlderAndMoveDown error:", error);
    } finally {
      setTimeout(() => {
        updateViewEvent();
      }, 0);

      isLoadingOlderEvents = false;
      updateCounts();
    }
  };
  /**
   * 古いイベントデータをキャッシュに保存
   * 既存データとマージし、重複を排除してソート
   * @param events 追加するイベントデータ
   */
  function updateQueryDataForOlder(events: EventPacket[]) {
    queryClient.setQueryData(
      [...queryKey, "olderData"],
      (oldData: EventPacket[] | undefined) => {
        const merged = [...(oldData ?? []), ...events];

        // 重複を排除（同じIDのイベントは最新のものを保持）
        const dedupMap = new Map(merged.map((p) => [p.event.id, p]));

        return sortEventPackets(Array.from(dedupMap.values()));
      }
    );
  }

  /**
   * 前のページに戻る
   * スクロール位置を調整してから表示位置を移動
   */
  const handlePrev = () => {
    if (viewIndex > 0) {
      scroll({
        top: window.scrollY + CONFIG.SCROLL_ADJUSTMENT,
      });

      viewIndex = Math.max(viewIndex - CONFIG.SLIDE_AMOUNT, 0);
      loadMoreDisabled = false;
      setTimeout(() => {
        updateViewEvent?.($globalData);
      }, CONFIG.SCROLL_DELAY);
    }
  };

  /**
   * タイムラインの先頭に戻る
   */
  const handleClickTop = () => {
    viewIndex = 0;
    updateViewEvent?.($globalData);
  };

  /**
   * タイムラインフィルタが変更された時にビューを更新
   */
  $effect(() => {
    if (timelineFilter.get()) {
      untrack(() => updateViewEvent?.($globalData));
    }
  });
</script>

{#if viewIndex !== 0}
  <div class="w-full">
    <button
      class="w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={() => handleClickTop()}
      disabled={$nowProgress}
    >
      <SkipForward
        size={20}
        class="mx-auto -rotate-90 stroke-magnum-100 fill-magnum-100"
      />
    </button>
    <button
      disabled={$nowProgress}
      class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={() => handlePrev()}
    >
      <Triangle size={20} class="mx-auto stroke-magnum-100 fill-magnum-100" />
    </button>
  </div>
{/if}

{#if lumiSetting.get().pubkey}
  <Metadata
    queryKey={["metadata", lumiSetting.get().pubkey]}
    pubkey={lumiSetting.get().pubkey}
  />
{/if}

{#if $errorData}
  {@render error?.($errorData)}
{:else if displayEvents.get() && displayEvents.get().length > 0}
  {@render content?.({
    events: displayEvents.get(),
    status: $status,
    len: $globalData?.length ?? 0,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}

{#if displayEvents.get() && displayEvents.get().length > 0}
  <button
    disabled={$nowProgress || loadMoreDisabled}
    class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
    onclick={() => handleNext()}
  >
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
    Load more
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
  </button>
{/if}
