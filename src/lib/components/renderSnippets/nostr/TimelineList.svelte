<!--メインTL以外のTL（グローバルとか、リストとか、ユーザーページのやつとか）-->
<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import {
    defaultRelays,
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
    //  updateViewEvent: (_data?: EventPacket[] | undefined | null) => void;
    resetUniq?: () => void;
  }
  // Constants
  const CONFIG = {
    SLIDE_AMOUNT: 40,
    UPDATE_DELAY: 20,
    LOAD_LIMIT: 50,
    FUTURE_EVENT_TOLERANCE: 10,
    SCROLL_ADJUSTMENT: 120,
    SCROLL_DELAY: 100,
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
    //  updateViewEvent = $bindable(),
    resetUniq = $bindable(),
  }: Props = $props();

  // State management
  class TimelineManager {
    allUniqueEvents: Nostr.Event[] = $state([]);
    updating = $state(false);
    timeoutId: NodeJS.Timeout | null = null;
    isOnMount = $state(false);
    isLoadingOlderEvents = $state(false);
    isUpdateScheduled = $state(false);
    destroyed = $state(false);
    currentEventCount = $state(0);
    requiredEventCount = $state(0);
    initRunning = $state(false);

    reset() {
      this.updating = false;
      this.isUpdateScheduled = false;
      $nowProgress = false;
    }

    fullReset() {
      console.log("timelineManager full reset");
      this.allUniqueEvents = [];
      this.timeoutId = null;
      this.isOnMount = false;
      this.isLoadingOlderEvents = false;
      this.destroyed = false;
      this.currentEventCount = 0;
      this.requiredEventCount = 0;
      this.initRunning = false;
      this.reset();
    }

    updateCounts() {
      this.currentEventCount = this.allUniqueEvents?.length || 0;
      this.requiredEventCount = viewIndex + amount + CONFIG.SLIDE_AMOUNT;
    }

    clearTimeout() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  $effect(() => {
    // ユーザーIDが変更された時にリセット
    if (page.params.npub) {
      timelineManager.fullReset();
    }
  });

  // const keyFn = (packet: EventPacket): string => packet.event.id;

  // const [uniq, eventIds] = createUniq(keyFn);
  // resetUniq = () => {
  //   eventIds.clear();
  // };
  const timelineManager: TimelineManager = new TimelineManager();
  const configureOperators = pipe(tie, uniq(), scanArray());

  let olderQueryKey = $derived([...queryKey, "olderData"]);

  onDestroy(() => {
    console.log("timeline destroy");
    timelineManager.clearTimeout();
    timelineManager.fullReset();
  });
  // Create query for older data
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

  console.log(filters);
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
    timelineManager.clearTimeout();

    timelineManager.timeoutId = setTimeout(() => {
      if (timelineManager.destroyed) {
        timelineManager.reset();
        return;
      }
      processUpdate(partialdata);
    }, CONFIG.UPDATE_DELAY);
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

  function processUpdate(partialdata?: EventPacket[]) {
    try {
      timelineManager.updating = true;

      const olderEvents: EventPacket[] | undefined = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]);

      const allEvents = mergeEvents($globalData, olderEvents, partialdata);

      timelineManager.allUniqueEvents = allEvents
        .map((event) => event.event)
        .filter(eventFilter)
        .filter(
          (event) => event.created_at <= now() + CONFIG.FUTURE_EVENT_TOLERANCE
        );

      const startIndex = Math.max(0, viewIndex);
      const endIndex = startIndex + amount;

      displayEvents.set(
        timelineManager.allUniqueEvents.slice(startIndex, endIndex)
      );

      timelineManager.isUpdateScheduled = false;
    } catch (error) {
      console.error("Error during update", error);
      timelineManager.isUpdateScheduled = false;
    } finally {
      timelineManager.updating = false;
      // $nowProgress = false;
      timelineManager.updateCounts();

      if (timelineManager.isUpdateScheduled) {
        scheduleUpdate();
      }
    }
  }

  // Effect to handle reactive state changes
  $effect(() => {
    if (($globalData && viewIndex >= 0) || !$nowProgress) {
      untrack(() => updateViewEvent());
    }
  });

  function createIncrementalHandler() {
    return (partialData: EventPacket[]) => {
      if (partialData.length === 0) return;
      updateViewEvent(partialData);
    };
  }

  // Initialize the component
  async function init() {
    if (timelineManager.initRunning) return;
    timelineManager.initRunning = true;
    $nowProgress = true;
    timelineManager.updating = false;
    const existingEvents: EventPacket[] | undefined =
      queryClient.getQueryData(olderQueryKey);

    if (!existingEvents || existingEvents.length <= 0) {
      const newFilters: Nostr.Filter[] = olderFilters.map((filter) => ({
        ...filter,
        since: undefined,
        until:
          filters[0].until === undefined
            ? (filter.since ?? now())
            : filter.until,
        limit: CONFIG.LOAD_LIMIT,
      }));
      timelineManager.isLoadingOlderEvents = true;
      // Wait for relay connections before proceeding

      await waitForConnections();
      const handleIncrementalData = createIncrementalHandler();

      const olderEvents = await firstLoadOlderEvents(
        CONFIG.LOAD_LIMIT,
        newFilters,
        configureOperators,
        relays,
        handleIncrementalData
      );

      if (olderEvents.length > 0) {
        if (olderEvents.length > 0) {
          // data にない id を除外
          const existingIds = new Set(
            ($globalData ?? []).map((p) => p.event.id)
          );
          const filtered = olderEvents.filter(
            (p) => !existingIds.has(p.event.id)
          );

          queryClient.setQueryData([...queryKey, "olderData"], () => filtered);
        }

        setTimeout(() => {
          updateViewEvent?.($globalData);
          timelineManager.isLoadingOlderEvents = false;
        }, 10);
      }
    }
    $nowProgress = false;
    timelineManager.initRunning = false;
  }

  // Lifecycle hooks
  onMount(async () => {
    timelineManager.isOnMount = true;
    await init();
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !timelineManager.isOnMount) {
      await init();
    }
  });

  const fetchAmount = CONFIG.LOAD_LIMIT * 5;

  // UI action handlers
  const handleNext = async () => {
    if ($nowProgress) return;

    let viewMoved = false;

    try {
      const hasEnoughStock =
        timelineManager.currentEventCount >=
        viewIndex + amount + CONFIG.SLIDE_AMOUNT;
      // console.log(
      //   timelineManager.currentEventCount,
      //   viewIndex + amount + CONFIG.SLIDE_AMOUNT
      // );
      if (hasEnoughStock) {
        viewIndex += CONFIG.SLIDE_AMOUNT;

        updateViewEvent();

        return;
      }

      // 👇 ストック不足でリクエスト中なら return
      if (timelineManager.isLoadingOlderEvents) {
        console.log("前回のデータ取得が完了していません");
        return;
      }

      // 👇 ストック不足でloadしても上限に満たなかったら中断
      const untilTime =
        timelineManager.allUniqueEvents?.[
          timelineManager.allUniqueEvents.length - 1
        ]?.created_at;

      if (!untilTime) {
        console.warn("No existing events to determine untilTime");
        return;
      }

      timelineManager.isLoadingOlderEvents = true;

      const fil = olderFilters.map((fil) => {
        return { ...fil, since: undefined };
      });
      console.log(fil);
      const olderEvents = await loadOlderEvents(
        fetchAmount,
        fil,
        untilTime,
        configureOperators,
        relays,
        (partialData) => {
          console.log(partialData);
          if (partialData.length === 0) return;

          timelineManager.updateCounts();
          //console.log(timelineManager.currentEventCount);
          const stillNotEnough =
            timelineManager.currentEventCount <
            viewIndex + amount + CONFIG.SLIDE_AMOUNT + 10; //重複考慮

          if (!viewMoved && !stillNotEnough) {
            viewIndex += CONFIG.SLIDE_AMOUNT;
            viewMoved = true;
            updateViewEvent(partialData);
          }

          updateViewEvent(partialData);
        }
      );

      if (olderEvents.length > 0) {
        updateQueryDataForOlder(olderEvents);
      }

      timelineManager.updateCounts();

      //
      if (
        !viewMoved &&
        olderEvents.length < fetchAmount &&
        timelineManager.currentEventCount <
          viewIndex + amount + CONFIG.SLIDE_AMOUNT
      ) {
        loadMoreDisabled = true;
      }

      // 👇 最後のチェック: 次のページのイベントが少しでもあったら移動
      if (
        !viewMoved &&
        timelineManager.currentEventCount > viewIndex + amount
      ) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
      }
    } catch (error) {
      console.error("loadOlderAndMoveDown error:", error);
    } finally {
      setTimeout(() => {
        updateViewEvent();
      }, 0);

      timelineManager.isLoadingOlderEvents = false;
      timelineManager.updateCounts();
    }
  };
  function updateQueryDataForOlder(events: EventPacket[]) {
    queryClient.setQueryData(
      [...queryKey, "olderData"],
      (oldData: EventPacket[] | undefined) => {
        const merged = [...(oldData ?? []), ...events];

        const dedupMap = new Map(merged.map((p) => [p.event.id, p]));

        return sortEventPackets(Array.from(dedupMap.values()));
      }
    );
  }
  const handlePrev = () => {
    if (viewIndex > 0) {
      scroll({
        top: window.scrollY + 120,
      });

      viewIndex = Math.max(viewIndex - CONFIG.SLIDE_AMOUNT, 0);
      loadMoreDisabled = false;
      setTimeout(() => {
        updateViewEvent?.($globalData);
      }, 100);
    }
  };

  const handleClickTop = () => {
    viewIndex = 0;
    updateViewEvent?.($globalData);
  };

  $effect(() => {
    // Handle timeline filter changes
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
