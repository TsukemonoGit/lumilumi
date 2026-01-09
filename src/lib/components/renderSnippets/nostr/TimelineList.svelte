<!--
  メインTL以外のタイムラインコンポーネント
  （グローバルTL、リストTL、ユーザーページのTLなど）
-->
<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { nowProgress, queryClient, tie } from "$lib/stores/stores";
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
  import { uniq } from "rx-nostr/src";
  import {
    displayEvents,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import { scanArray } from "$lib/stores/operators";
  import { sortEventPackets } from "$lib/func/util";
  import { page } from "$app/state";
  import { SvelteMap } from "svelte/reactivity";

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

  const CONFIG = {
    SLIDE_AMOUNT: 40,
    UPDATE_DELAY: 20,
    LOAD_LIMIT: 50,
    FUTURE_EVENT_TOLERANCE: 10,
    SCROLL_ADJUSTMENT: 120,
    SCROLL_DELAY: 100,
    INIT_UPDATE_DELAY: 10,
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

  // Map による状態管理
  const allUniqueEventsMap: SvelteMap<string, Nostr.Event> = new SvelteMap();

  let updating = $state(false);
  let timeoutId: NodeJS.Timeout | null = null;
  let isOnMount = $state(false);
  let isLoadingOlderEvents = $state(false);
  let isUpdateScheduled = $state(false);
  let destroyed = $state(false);
  let currentEventCount = $state(0);
  let initRunning = $state(false);

  function resetTimeline() {
    updating = false;
    isUpdateScheduled = false;
    $nowProgress = false;
  }

  function fullResetTimeline() {
    allUniqueEventsMap.clear();
    timeoutId = null;
    isOnMount = false;
    isLoadingOlderEvents = false;

    currentEventCount = 0;
    initRunning = false;
    resetTimeline();
  }

  function updateCounts() {
    currentEventCount = allUniqueEventsMap.size;
  }

  function clearTimelineTimeout() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  const configureOperators = pipe(tie, uniq(), scanArray());

  let olderQueryKey = $derived([...queryKey, "olderData"]);

  onDestroy(() => {
    destroyed = true;
    console.log("destroy");
    fullResetTimeline();
    clearTimelineTimeout();
  });

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

  //svelte-ignore state_referenced_locally
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

  const updateViewEvent = (partialdata?: EventPacket[] | null | undefined) => {
    if (destroyed) return;
    if (isUpdateScheduled) return;

    isUpdateScheduled = true;

    if (!updating) {
      scheduleUpdate(partialdata || []);
    }
  };

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
   * イベントをMapにマージ
   * Mapの特性により自動的に重複が排除される
   */
  function mergeEventsToMap(
    current: EventPacket[] | null | undefined,
    older: EventPacket[] | undefined,
    partial: EventPacket[] | undefined
  ): void {
    allUniqueEventsMap.clear();
    if (destroyed) return;
    [...(current || []), ...(older || []), ...(partial || [])].forEach((pk) => {
      if (
        eventFilter(pk.event) &&
        pk.event.created_at <= now() + CONFIG.FUTURE_EVENT_TOLERANCE
      ) {
        allUniqueEventsMap.set(pk.event.id, pk.event);
      }
    });
  }

  function processUpdate(partialdata?: EventPacket[]) {
    if (destroyed) return;
    try {
      updating = true;

      const olderEvents: EventPacket[] | undefined = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]);

      mergeEventsToMap($globalData, olderEvents, partialdata);

      // Mapから配列を生成してソート
      const sortedEvents = Array.from(allUniqueEventsMap.values()).sort(
        (a, b) => b.created_at - a.created_at
      );

      const startIndex = Math.max(0, viewIndex);
      const endIndex = startIndex + amount;

      displayEvents.set(sortedEvents.slice(startIndex, endIndex));

      isUpdateScheduled = false;
    } catch (error) {
      console.error("Error during update", error);
      isUpdateScheduled = false;
    } finally {
      updating = false;
      updateCounts();

      if (isUpdateScheduled && !destroyed) {
        scheduleUpdate();
      }
    }
  }

  $effect(() => {
    if ((($globalData && viewIndex >= 0) || !$nowProgress) && !destroyed) {
      untrack(() => updateViewEvent());
    }
  });

  function createIncrementalHandler() {
    return (partialData: EventPacket[]) => {
      if (destroyed || partialData.length === 0) return;
      updateViewEvent(partialData);
    };
  }

  async function init() {
    if (initRunning) return;
    initRunning = true;
    $nowProgress = true;
    updating = false;
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
      isLoadingOlderEvents = true;

      await waitForConnections();
      if (destroyed) return;
      const handleIncrementalData = createIncrementalHandler();

      const olderEvents = await firstLoadOlderEvents(
        CONFIG.LOAD_LIMIT,
        newFilters,
        configureOperators,
        relays,
        handleIncrementalData
      );
      if (destroyed) return;
      if (olderEvents.length > 0) {
        queryClient.setQueryData([...queryKey, "olderData"], () => olderEvents);

        setTimeout(() => {
          if (destroyed) return;
          updateViewEvent?.($globalData);
          isLoadingOlderEvents = false;
        }, CONFIG.INIT_UPDATE_DELAY);
      }
    }
    $nowProgress = false;
    initRunning = false;
  }

  onMount(async () => {
    isOnMount = true;
    await init();
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      await init();
    }
  });

  const fetchAmount = CONFIG.LOAD_LIMIT * 5;

  const handleNext = async () => {
    if ($nowProgress) return;

    let viewMoved = false;

    try {
      const hasEnoughStock =
        currentEventCount >= viewIndex + amount + CONFIG.SLIDE_AMOUNT;

      if (hasEnoughStock) {
        viewIndex += CONFIG.SLIDE_AMOUNT;
        updateViewEvent();

        return;
      }

      if (isLoadingOlderEvents) {
        return;
      }

      const olderData: EventPacket[] | undefined = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]);
      const untilTime = olderData?.[olderData.length - 1]?.event.created_at;

      if (!untilTime) {
        console.warn("No existing events to determine untilTime");
        return;
      }

      isLoadingOlderEvents = true;

      const filtersWithoutSince = olderFilters.map((filter) => ({
        ...filter,
        since: undefined,
      }));

      $nowProgress = true;

      const olderEvents = await loadOlderEvents(
        fetchAmount,
        filtersWithoutSince,
        untilTime,
        configureOperators,
        relays,
        (partialData) => {
          if (destroyed || partialData.length === 0) return;

          updateCounts();
          const stillNotEnough =
            currentEventCount < viewIndex + amount + CONFIG.SLIDE_AMOUNT + 10;

          if (!viewMoved && !stillNotEnough) {
            viewIndex += CONFIG.SLIDE_AMOUNT;
            viewMoved = true;
            $nowProgress = false;
          }

          updateViewEvent(partialData);
        }
      );
      if (destroyed) return;
      if (olderEvents.length > 0) {
        updateQueryDataForOlder(olderEvents);
      }

      updateCounts();

      if (
        !viewMoved &&
        olderEvents.length < fetchAmount &&
        currentEventCount < viewIndex + amount + CONFIG.SLIDE_AMOUNT
      ) {
        loadMoreDisabled = true;
      }

      if (!viewMoved && currentEventCount > viewIndex + amount) {
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
      $nowProgress = false;
    }
  };

  function updateQueryDataForOlder(events: EventPacket[]) {
    queryClient.setQueryData(
      [...queryKey, "olderData"],
      (oldData: EventPacket[] | undefined) => {
        if (!oldData || oldData.length === 0) {
          return sortEventPackets(events);
        }

        const existingIds = new Set(oldData.map((pk) => pk.event.id));
        const uniqueEvents = events.filter(
          (pk) => !existingIds.has(pk.event.id)
        );

        return sortEventPackets([...oldData, ...uniqueEvents]);
      }
    );
  }

  const handlePrev = () => {
    if (viewIndex > 0) {
      scroll({
        top: window.scrollY + CONFIG.SCROLL_ADJUSTMENT,
      });

      viewIndex = Math.max(viewIndex - CONFIG.SLIDE_AMOUNT, 0);
      loadMoreDisabled = false;
      setTimeout(() => {
        if (destroyed) return;
        updateViewEvent?.($globalData);
      }, CONFIG.SCROLL_DELAY);
    }
  };

  const handleClickTop = () => {
    viewIndex = 0;
    updateViewEvent?.($globalData);
  };

  $effect(() => {
    if (timelineFilter) {
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
