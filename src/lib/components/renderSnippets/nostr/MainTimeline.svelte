<script lang="ts">
  import { onDestroy, untrack, type Snippet } from "svelte";
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
    error?: Snippet<[Error]>;
    nodata?: Snippet;
    loading?: Snippet;
    content?: Snippet<
      [{ events: Nostr.Event<number>[]; status: ReqStatus; len: number }]
    >;
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
    filteredOlderEventCount = $state(0);
    filteredNewerEventCount = $state(0);
    requiredEventCount = $derived(viewIndex + amount + CONFIG.SLIDE_AMOUNT);

    // Map による管理
    currentEventsMap = $state<Map<string, Nostr.Event>>(new Map());
    olderEventsMap = $state<Map<string, Nostr.Event>>(new Map());

    get loadMoreDisabled() {
      if ($nowProgress || this.isOnMount) return true;

      if (this.isLoadingOlderEvents) {
        const hasEnoughStock =
          this.filteredOlderEventCount >=
          viewIndex + amount + CONFIG.SLIDE_AMOUNT;
        return !hasEnoughStock;
      }

      return false;
    }

    reset() {
      this.updating = false;
      this.isUpdateScheduled = false;
      $nowProgress = false;
    }

    clear() {
      this.currentEventsMap.clear();
      this.olderEventsMap.clear();
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
   * イベントをフィルタリングして Map に追加
   */
  function filterAndAddToMap(
    events: EventPacket[],
    targetMap: Map<string, Nostr.Event>
  ): number {
    return events.reduce((count, pk) => {
      const event = pk.event;
      if (
        eventFilter(event) &&
        event.created_at <= now() + CONFIG.FUTURE_EVENT_TOLERANCE
      ) {
        targetMap.set(event.id, event);
        return count + 1;
      }
      return count;
    }, 0);
  }

  /**
   * 複数の Map を結合して配列を生成
   */
  function combineFilteredEvents(
    currentMap: Map<string, Nostr.Event>,
    olderMap: Map<string, Nostr.Event>,
    partialEvents?: EventPacket[]
  ): Nostr.Event[] {
    const resultMap = new Map<string, Nostr.Event>();

    // currentMap を追加
    currentMap.forEach((event, id) => {
      resultMap.set(id, event);
    });

    // olderMap を追加
    olderMap.forEach((event, id) => {
      resultMap.set(id, event);
    });

    // partialEvents をフィルタリングして追加
    if (partialEvents) {
      partialEvents.forEach((pk) => {
        const event = pk.event;
        if (
          eventFilter(event) &&
          event.created_at <= now() + CONFIG.FUTURE_EVENT_TOLERANCE
        ) {
          resultMap.set(event.id, event);
        }
      });
    }

    return Array.from(resultMap.values());
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

      const { startIndex, endIndex } = calculateDisplayRange();

      // currentEventsMap を更新
      timelineManager.currentEventsMap.clear();
      timelineManager.filteredNewerEventCount = filterAndAddToMap(
        $data || [],
        timelineManager.currentEventsMap
      );

      // 現在のデータだけで十分かチェック
      if (timelineManager.currentEventsMap.size >= endIndex) {
        const events = Array.from(timelineManager.currentEventsMap.values());
        displayEvents.set(events.slice(startIndex, endIndex));
      } else {
        // 古いデータも取得して結合
        const olderEvents: EventPacket[] | null | undefined =
          queryClient?.getQueryData([...queryKey, "olderData"]);

        if (olderEvents) {
          timelineManager.olderEventsMap.clear();
          timelineManager.filteredOlderEventCount = filterAndAddToMap(
            olderEvents,
            timelineManager.olderEventsMap
          );
        }

        const allFilteredEvents = combineFilteredEvents(
          timelineManager.currentEventsMap,
          timelineManager.olderEventsMap,
          partialdata
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

  function calculateDisplayRange() {
    const startIndex = Math.max(0, viewIndex);
    const endIndex = startIndex + amount;
    return { startIndex, endIndex };
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
        // Map で重複削除
        const eventMap = new Map<string, EventPacket>();
        [...(oldData ?? []), ...events].forEach((packet) => {
          eventMap.set(packet.event.id, packet);
        });

        const deduplicatedData = sortEventPackets(
          Array.from(eventMap.values())
        );

        // フィルタリング後のカウントを更新
        const tempMap = new Map<string, Nostr.Event>();
        timelineManager.filteredOlderEventCount = filterAndAddToMap(
          deduplicatedData,
          tempMap
        );

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

    try {
      const hasEnoughStock =
        timelineManager.filteredNewerEventCount +
          timelineManager.filteredOlderEventCount >=
        viewIndex + amount + CONFIG.SLIDE_AMOUNT + viewIndex * 0.1;

      console.log(
        timelineManager.filteredNewerEventCount +
          timelineManager.filteredOlderEventCount,
        viewIndex + amount + CONFIG.SLIDE_AMOUNT + viewIndex * 0.1
      );

      if (hasEnoughStock) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
        updateHistoryState();
        setTimeout(() => {
          updateViewEvent();
        });
        return;
      }

      if (timelineManager.isLoadingOlderEvents) {
        addDebugLog("前回のデータ取得が完了していません");
        return;
      }

      const older = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]) as EventPacket[];

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
            viewIndex + amount + CONFIG.SLIDE_AMOUNT + viewIndex * 0.1;

          if (!viewMoved && !stillNotEnough) {
            viewIndex += CONFIG.SLIDE_AMOUNT;
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

      if (
        !viewMoved &&
        timelineManager.filteredNewerEventCount +
          timelineManager.filteredOlderEventCount >
          viewIndex + amount
      ) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
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
        // Map で重複削除
        const eventMap = new Map<string, EventPacket>();
        [...(oldData ?? []), ...events].forEach((packet) => {
          eventMap.set(packet.event.id, packet);
        });

        return sortEventPackets(Array.from(eventMap.values()));
      }
    );
  }

  function moveUp() {
    if (viewIndex <= 0) return;

    if (typeof window !== "undefined") {
      window.scrollTo({ top: window.scrollY + CONFIG.SCROLL_ADJUSTMENT });
    }

    viewIndex = Math.max(viewIndex - CONFIG.SLIDE_AMOUNT, 0);
    updateHistoryState();

    setTimeout(() => {
      updateViewEvent();
    }, CONFIG.SCROLL_DELAY);
  }

  function moveToTop() {
    viewIndex = 0;
    updateHistoryState();
    updateViewEvent();
  }

  //svelte-ignore state_referenced_locally
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
    // オブジェクト全体を展開して全プロパティを参照
    const _ = { ...timelineFilter };

    untrack(() => updateViewEvent());
  });

  onDestroy(() => {
    debugInfo("main timeline destroy");
    timelineManager.destroyed = true;
    if (timelineManager.timeoutId) {
      clearTimeout(timelineManager.timeoutId);
    }
    timelineManager.clear();
  });

  $effect(() => {
    if (lumiSetting.get().pubkey) {
      untrack(async () => {
        timelineManager.isOnMount = true;
        $nowProgress = true;
        await initializeTimeline();
        timelineManager.isOnMount = false;
        $nowProgress = false;
      });
    }
  });

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
