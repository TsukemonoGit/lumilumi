<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { onDestroy, onMount, untrack } from "svelte";
  import { pipe } from "rxjs";
  import { now, type EventPacket } from "rx-nostr";
  import { createUniq } from "rx-nostr/src";
  import { type QueryKey, createQuery } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";

  // Store imports
  import {
    defaultRelays,
    nowProgress,
    queryClient,
    tie,
  } from "$lib/stores/stores";
  import {
    displayEvents,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";

  // Utility functions
  import { sortEventPackets } from "$lib/func/util";
  import {
    userStatus,
    reactionCheck,
    scanArray,
    saveEachNote,
  } from "$lib/stores/operators";
  import {
    firstLoadOlderEvents,
    loadOlderEvents,
    waitForConnections,
  } from "./timelineList";
  import { useMainTimeline } from "$lib/stores/useMainTimeline";

  // Component imports
  import Metadata from "./Metadata.svelte";

  // Types
  import type { ReqStatus } from "$lib/types";
  import { replaceState } from "$app/navigation";
  import {
    addDebugLog,
    debugError,
    debugInfo,
    debugWarn,
  } from "$lib/components/Debug/debug";

  // Constants
  const CONFIG = {
    SLIDE_AMOUNT: 40,
    UPDATE_DELAY: 20,
    LOAD_LIMIT: 50,
    FUTURE_EVENT_TOLERANCE: 10,
    SCROLL_ADJUSTMENT: 120,
    SCROLL_DELAY: 100,
  };

  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    olderFilters: Nostr.Filter[];

    relays?: string[] | undefined;
    eventFilter: (event: Nostr.Event) => boolean;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;
    content?: import("svelte").Snippet<
      [{ events: Nostr.Event<number>[]; status: ReqStatus; len: number }]
    >;
    // updateViewEvent: (partialdata?: EventPacket[] | null | undefined) => void;
  }

  let {
    queryKey,
    filters,
    olderFilters,

    relays = undefined,
    eventFilter = () => true,
    error,
    loading,
    nodata,
    content,
    // updateViewEvent = $bindable(),
  }: Props = $props();
  let viewIndex = $state(0);
  const amount = 50;
  // State management
  class TimelineManager {
    updating = $state(false);
    timeoutId: NodeJS.Timeout | null = null;
    isOnMount = $state(false);
    isLoadingOlderEvents = $state(false);
    isUpdateScheduled = $state(false);
    destroyed = $state(false);
    filteredOlderEventCount = $state(0); // currentEventCount から filteredOlderEventCount に変更
    filteredNewerEventCount = $state(0);
    requiredEventCount = $derived(viewIndex + amount + CONFIG.SLIDE_AMOUNT);

    get loadMoreDisabled() {
      // nowProgressまたは初期化中の場合は常に無効
      if ($nowProgress || this.isOnMount) return true;

      // 前回のデータ取得中の場合
      if (this.isLoadingOlderEvents) {
        // ストックが十分にある場合のみ有効
        const hasEnoughStock =
          this.filteredOlderEventCount >=
          viewIndex + amount + CONFIG.SLIDE_AMOUNT; // filteredOlderEventCountを使用
        return !hasEnoughStock;
      }

      return false;
    }

    reset() {
      this.updating = false;
      this.isUpdateScheduled = false;
      $nowProgress = false;
    }
  }

  const timelineManager = new TimelineManager();

  // Rx-Nostr setup
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const [uniq, eventIds] = createUniq(keyFn);

  // Query setup
  let result = $derived(
    useMainTimeline(queryKey, configureOperators(), filters)
  );
  const data = $derived(result.data);
  const status = $derived(result.status);
  const errorData = $derived(result.error);

  // Computed values
  const readUrls = $derived.by(() => {
    if (!$defaultRelays) return [];
    return Object.values($defaultRelays)
      .filter((config) => config.read)
      .map((config) => config.url);
  });

  /**
   * Configures the rx-nostr operators pipeline
   */
  function configureOperators() {
    let operator = pipe(tie, uniq);

    if (lumiSetting.get().showUserStatus) {
      operator = pipe(operator, userStatus());
    }

    operator = pipe(
      operator,
      reactionCheck(lumiSetting.get().showReactioninTL)
    );

    return pipe(operator, saveEachNote(), scanArray());
  }

  /**
   * Event deduplication and merging utility
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
    // current, olderは重複なし、partialとの重複のみチェック
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
   * Update scheduling and execution
   */
  const updateViewEvent = (partialdata?: EventPacket[] | null | undefined) => {
    if (timelineManager.isUpdateScheduled) return;

    timelineManager.isUpdateScheduled = true;

    if (!timelineManager.updating) {
      scheduleUpdate(partialdata || []);
    }
  };

  function scheduleUpdate(partialdata?: EventPacket[]) {
    if (timelineManager.timeoutId) {
      clearTimeout(timelineManager.timeoutId);
    }

    timelineManager.timeoutId = setTimeout(() => {
      if (timelineManager.destroyed) {
        timelineManager.reset();
        return;
      }
      processUpdate(partialdata);
    }, CONFIG.UPDATE_DELAY);
  }

  function processUpdate(partialdata?: EventPacket[]) {
    try {
      timelineManager.updating = true;

      // 表示範囲を計算
      const { startIndex, endIndex } = calculateDisplayRange();

      // 現在のデータをフィルタリング
      const currentEvents = filterEvents($data || []);
      timelineManager.filteredNewerEventCount = currentEvents.length;
      // 現在のデータだけで表示範囲をカバーできるかチェック
      if (currentEvents.length >= endIndex) {
        // 十分な場合：現在のデータのみ使用
        displayEvents.set(currentEvents.slice(startIndex, endIndex));
      } else {
        // 不十分な場合：古いデータも個別にフィルタリングして結合
        const olderEvents: EventPacket[] | null | undefined =
          queryClient?.getQueryData([...queryKey, "olderData"]);
        const filteredOlderEvents = olderEvents
          ? filterEvents(olderEvents)
          : [];
        //フィルターは変わるからこっちでカウント数える
        timelineManager.filteredOlderEventCount = filteredOlderEvents.length;
        const filteredPartialEvents = partialdata
          ? filterEvents(partialdata)
          : [];

        // フィルタリング済みのイベントを結合
        const allFilteredEvents = combineFilteredEvents(
          currentEvents,
          filteredOlderEvents,
          filteredPartialEvents
        );

        displayEvents.set(allFilteredEvents.slice(startIndex, endIndex));
      }
      timelineManager.isUpdateScheduled = false;
    } catch (error) {
      console.error("Error during update", error);
      timelineManager.isUpdateScheduled = false;
    } finally {
      timelineManager.updating = false;
      $nowProgress = false;

      if (timelineManager.isUpdateScheduled) {
        scheduleUpdate();
      }
    }
  }
  /**
   * フィルタリング済みのイベント配列を結合
   * 重複除去と時系列ソートを行う
   * @param currentEvents - 現在のイベント
   * @param olderEvents - 古いイベント
   * @param partialEvents - 部分的なイベント
   * @returns 結合済みのイベント配列
   */
  function combineFilteredEvents(
    currentEvents: Nostr.Event[],
    olderEvents: Nostr.Event[],
    partialEvents: Nostr.Event[]
  ) {
    // 全イベントを結合
    const allEvents = [...currentEvents, ...olderEvents, ...partialEvents];

    // 重複除去（IDベース）
    return Array.from(
      new Map(allEvents.map((event) => [event.id, event])).values()
    );
  }
  /**
   * 表示範囲のインデックスを計算
   * @returns 開始と終了インデックス
   */
  function calculateDisplayRange() {
    const startIndex = Math.max(0, viewIndex);
    const endIndex = startIndex + amount;
    return { startIndex, endIndex };
  }

  /**
   * イベントデータをフィルタリング
   * @param events - フィルタリング対象のイベント配列
   * @returns フィルタリング済みのイベント配列
   */
  function filterEvents(events: EventPacket[]) {
    return events
      .map((event) => event.event)
      .filter(eventFilter)
      .filter(
        (event) => event.created_at <= now() + CONFIG.FUTURE_EVENT_TOLERANCE
      );
  }
  /**
   * Timeline initialization
   */
  async function initializeTimeline() {
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const savedViewIndex = urlParams?.get("idx");
    try {
      const existingEvents: EventPacket[] | undefined =
        queryClient?.getQueryData([...queryKey, "olderData"]);

      if (existingEvents && existingEvents.length > 0) {
        addDebugLog(`既存データ${existingEvents.length}件を使用`);
        //  updateViewEvent();

        //ページ復元
        const allLen = [...($data || []), ...existingEvents].length;

        if (savedViewIndex && allLen > parseInt(savedViewIndex, 10) + amount) {
          viewIndex = parseInt(savedViewIndex, 10);
          console.log(viewIndex);
        } else {
          updateHistoryState();
        }

        updateViewEvent();
        return;
      }
      //ページ復元

      updateHistoryState();

      timelineManager.isLoadingOlderEvents = true;

      if (readUrls && readUrls.length > 0) {
        addDebugLog("リレー接続を確立中...");
        await waitForConnections();
      }

      const initialFilters = createInitialFilters();
      const handleIncrementalData = createIncrementalHandler();

      addDebugLog("初期データを取得中...");

      const olderEvents = await firstLoadOlderEvents(
        CONFIG.LOAD_LIMIT,
        initialFilters,
        pipe(tie, uniq, scanArray()),
        relays,
        handleIncrementalData
      );

      if (olderEvents.length > 0) {
        updateQueryData(olderEvents);
      }

      addDebugLog(`初期化完了: ${olderEvents.length}件のイベントを取得`);
    } catch (error) {
      addDebugLog("Timeline初期化エラー:", error);
      handleFallbackData();
    } finally {
      updateViewEvent();
      timelineManager.isLoadingOlderEvents = false;
    }
  }

  function createInitialFilters(): Nostr.Filter[] {
    return olderFilters.map((filter) => ({
      ...filter,
      since: undefined,
      until: filters[0]?.until ?? filter.since ?? now(),
      limit: CONFIG.LOAD_LIMIT,
    }));
  }

  function createIncrementalHandler() {
    return (partialData: EventPacket[]) => {
      if (partialData.length === 0) return;
      updateViewEvent(partialData);
    };
  }

  function updateQueryData(events: EventPacket[]) {
    queryClient.setQueryData(
      [...queryKey, "olderData"],
      (oldData: EventPacket[] | undefined) => {
        const deduplicatedData = sortEventPackets(
          Array.from(
            new Map(
              [...(oldData ?? []), ...events].map((packet) => [
                packet.event.id,
                packet,
              ])
            ).values()
          )
        );
        timelineManager.filteredOlderEventCount =
          filterEvents(deduplicatedData).length;
        return CONFIG.LOAD_LIMIT > 0
          ? deduplicatedData.slice(0, CONFIG.LOAD_LIMIT)
          : deduplicatedData;
      }
    );
  }

  function handleFallbackData() {
    const fallbackData = queryClient?.getQueryData([
      ...queryKey,
      "olderData",
    ]) as EventPacket[];

    if (fallbackData && fallbackData.length > 0) {
      addDebugLog("フォールバックデータを使用");
    }
  }

  /**
   * Navigation functions
   */
  async function loadOlderAndMoveDown() {
    if ($nowProgress) return;

    $nowProgress = true;
    let viewMoved = false;
    //const previousViewIndex = viewIndex; // 元の位置を保存
    try {
      const hasEnoughStock =
        timelineManager.filteredNewerEventCount +
          timelineManager.filteredOlderEventCount >=
        viewIndex + amount + CONFIG.SLIDE_AMOUNT + viewIndex * 0.1; //フィルター考慮
      console.log(
        timelineManager.filteredNewerEventCount +
          timelineManager.filteredOlderEventCount,
        viewIndex + amount + CONFIG.SLIDE_AMOUNT + viewIndex * 0.1
      );
      if (hasEnoughStock) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
        // viewIndexが変更された場合のみ履歴を更新

        updateHistoryState();
        setTimeout(() => {
          updateViewEvent();
        });
        return;
      }

      // 👇 ストック不足でリクエスト中なら return
      if (timelineManager.isLoadingOlderEvents) {
        addDebugLog("前回のデータ取得が完了していません");
        return;
      }
      const older = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]) as EventPacket[];
      // 👇 ストック不足でloadしても上限に満たなかったら中断
      const untilTime = older?.[older.length - 1]?.event.created_at;

      if (!untilTime) {
        debugWarn("No existing events to determine untilTime");
        return;
      }

      timelineManager.isLoadingOlderEvents = true;

      const fetchAmount = CONFIG.LOAD_LIMIT * 5;

      const olderEvents = await loadOlderEvents(
        fetchAmount,
        olderFilters.map((fil) => {
          return { ...fil, since: undefined };
        }),
        untilTime,
        pipe(tie, uniq, scanArray()),
        relays,
        (partialData) => {
          if (partialData.length === 0) return;

          const stillNotEnough =
            timelineManager.filteredNewerEventCount +
              timelineManager.filteredOlderEventCount +
              partialData.length <
            viewIndex + amount + CONFIG.SLIDE_AMOUNT + viewIndex * 0.1; //フィルター考慮

          if (!viewMoved && !stillNotEnough) {
            viewIndex += CONFIG.SLIDE_AMOUNT;
            // viewIndexが変更された場合のみ履歴を更新

            updateHistoryState();

            viewMoved = true;

            updateViewEvent(partialData);
          }

          updateViewEvent(partialData);
        }
      );

      if (olderEvents.length > 0) {
        updateQueryDataForOlder(olderEvents);
      }

      // 👇 最後のチェック: 次のページのイベントが少しでもあったら移動
      if (
        !viewMoved &&
        timelineManager.filteredNewerEventCount +
          timelineManager.filteredOlderEventCount >
          viewIndex + amount
      ) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
        // viewIndexが変更された場合のみ履歴を更新

        updateHistoryState();
      }
      updateViewEvent();
    } catch (error) {
      debugError("loadOlderAndMoveDown error:", error);
    } finally {
      $nowProgress = false;
      timelineManager.isLoadingOlderEvents = false;
    }
  }

  function updateQueryDataForOlder(events: EventPacket[]) {
    queryClient.setQueryData(
      [...queryKey, "olderData"],
      (oldData: EventPacket[] | undefined) => {
        const older = sortEventPackets(
          Array.from(
            new Map(
              [...(oldData ?? []), ...events].map((packet) => [
                packet.event.id,
                packet,
              ])
            ).values()
          )
        );

        return older;
      }
    );
  }

  function moveUp() {
    if (viewIndex <= 0) return;

    if (typeof window !== "undefined") {
      window.scrollTo({ top: window.scrollY + CONFIG.SCROLL_ADJUSTMENT });
    }

    viewIndex = Math.max(viewIndex - CONFIG.SLIDE_AMOUNT, 0);

    // 履歴を更新
    updateHistoryState();

    setTimeout(() => {
      updateViewEvent();
    }, CONFIG.SCROLL_DELAY);
  }

  function moveToTop() {
    viewIndex = 0;

    // 履歴を更新

    updateHistoryState();

    updateViewEvent();
  }

  // Query for older data
  createQuery({
    queryKey: [...queryKey, "olderData"],
    queryFn: undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Effects
  $effect(() => {
    if ($data && viewIndex >= 0 && !$nowProgress) {
      untrack(() => updateViewEvent());
    }
  });

  $effect(() => {
    if (timelineFilter.get()) {
      untrack(() => updateViewEvent());
    }
  });

  /*  // Lifecycle
 //effectでやってるからいらん
  onMount(async () => {
    if (timelineManager.isOnMount || !lumiSetting.get().pubkey) return;

    if (!timelineManager.isOnMount) {
      timelineManager.isOnMount = true;
      $nowProgress = true;
      await initializeTimeline();
      timelineManager.isOnMount = false;
      $nowProgress = false;
    }
  });

  afterNavigate(async (navigate) => {
    if (
      navigate.type === "form" ||
      timelineManager.isOnMount ||
      !lumiSetting.get().pubkey
    )
      return;

    if (!timelineManager.isOnMount) {
      timelineManager.isOnMount = true;
      $nowProgress = true;
      await initializeTimeline();
      timelineManager.isOnMount = false;
      $nowProgress = false;
    }
  }); */

  onDestroy(() => {
    debugInfo("main timeline destroy");
    timelineManager.destroyed = true;
    if (timelineManager.timeoutId) {
      clearTimeout(timelineManager.timeoutId);
    }
  });
  $effect(() => {
    if (lumiSetting.get().pubkey) {
      untrack(async () => {
        // console.log(filters);

        timelineManager.isOnMount = true;
        $nowProgress = true;
        await initializeTimeline();
        timelineManager.isOnMount = false;
        $nowProgress = false;
      });
    }
  });

  // 履歴管理用の関数（replaceStateのみ使用）
  function updateHistoryState() {
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (viewIndex === 0) {
        currentUrl.searchParams.delete("idx");
      } else {
        currentUrl.searchParams.set("idx", viewIndex.toString());
      }
      replaceState(currentUrl.toString(), { viewIndex });
    }
  }
</script>

{#if viewIndex !== 0}
  <div class="w-full">
    <button
      class="w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={moveToTop}
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
      onclick={moveUp}
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
    len: $data?.length ?? 0,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}

{#if displayEvents.get() && displayEvents.get().length > 0}
  <button
    disabled={timelineManager.loadMoreDisabled}
    class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
    onclick={loadOlderAndMoveDown}
  >
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
    Load more
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
  </button>
{/if}
