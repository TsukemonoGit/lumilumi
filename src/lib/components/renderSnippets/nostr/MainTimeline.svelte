<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { onDestroy, onMount, untrack } from "svelte";
  import { get } from "svelte/store";
  import { pipe, type OperatorFunction } from "rxjs";
  import { createTie, now, type EventPacket } from "rx-nostr";
  import { createUniq } from "rx-nostr/src";
  import { type QueryKey, createQuery } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";

  // Store imports
  import {
    defaultRelays,
    loginUser,
    nowProgress,
    queryClient,
    tieMapStore,
  } from "$lib/stores/stores";
  import {
    displayEvents,
    lumiSetting,
    relayStateMap,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";

  // Utility functions
  import { sortEventPackets } from "$lib/func/util";
  import { userStatus, reactionCheck, scanArray } from "$lib/stores/operators";
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

  // Constants
  const SLIDE_AMOUNT = 40; // Number of events to slide in pagination
  const UPDATE_DELAY = 20; // Delay for debouncing view updates (ms)
  const LOAD_LIMIT = 50; // Number of events to fetch in initial load
  const CONNECTION_TIMEOUT = 5000; // Maximum time to wait for relay connections (ms)

  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    olderFilters: Nostr.Filter[];
    viewIndex: number;
    amount: number;
    relays?: string[] | undefined;
    tieKey: string;
    eventFilter: (event: Nostr.Event) => boolean;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;
    content?: import("svelte").Snippet<
      [{ events: Nostr.Event<number>[]; status: ReqStatus; len: number }]
    >;
    updateViewEvent: (_data?: EventPacket[] | undefined | null) => void;
  }

  let {
    queryKey,
    filters,
    olderFilters,
    viewIndex,
    amount,
    relays = undefined,
    tieKey,
    eventFilter = () => true,
    error,
    loading,
    nodata,
    content,
    updateViewEvent = $bindable(),
  }: Props = $props();

  // State variables
  let allUniqueEvents: Nostr.Event[] = [];

  let updating: boolean = false;
  let timeoutId: NodeJS.Timeout | null = null;
  let isOnMount: boolean = false;

  let tie: OperatorFunction<
    EventPacket,
    EventPacket & {
      seenOn: Set<string>;
      isNew: boolean;
    }
  >;
  let tieMap: Map<string, Set<string>>;

  // Event handlers for the uniq operator
  const keyFn = (packet: EventPacket): string => packet.event.id;
  const onCache = (packet: EventPacket): void => {
    // Called when a new unique event is received
  };
  const onHit = (packet: EventPacket): void => {
    // Called when a duplicate event is received
  };
  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });

  // Query setup
  let result = useMainTimeline(queryKey, configureOperators(), filters);
  let data = $derived(result.data);
  let deriveaData = $derived($data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
  let destroyed = false;

  // Get read URLs from default relays
  let readUrls = $derived.by(() => {
    if ($defaultRelays) {
      return Object.values($defaultRelays)
        .filter((config) => config.read)
        .map((config) => config.url);
    }
  });

  /**
   * Configures the rx-nostr operators pipeline based on settings
   */
  function configureOperators() {
    registerTie(tieKey);
    let operator = pipe(tie, uniq);

    // Add user status operator for main timeline if enabled
    if (lumiSetting.get().showUserStatus) {
      operator = pipe(operator, userStatus());
    }

    // Add reaction check operator for main timeline if enabled
    if (lumiSetting.get().showReactioninTL) {
      operator = pipe(operator, reactionCheck());
    }

    // Final operator to convert to array
    return pipe(operator, scanArray());
  }

  /**
   * Registers the tie in the global store
   */
  function registerTie(key: string) {
    //すでにあったらそれをつかう
    // なかったら作る

    //console.log($tieMapStore);
    if (!key) return;

    if (!$tieMapStore) {
      // Create rx-nostr tie and uniq operator
      [tie, tieMap] = createTie();
      $tieMapStore = { [key]: [tie, tieMap] };
    } else if (!$tieMapStore?.[key]) {
      [tie, tieMap] = createTie();
      $tieMapStore = { ...$tieMapStore, [key]: [tie, tieMap] };
    } else {
      [tie, tieMap] = $tieMapStore[key];
    }
  }

  /**
   * 常に最新のイベントでビューを更新する関数
   * updating状態でも必ず最新データが反映されるようにする
   */
  let isUpdateScheduled: boolean = false;
  updateViewEvent = (_data: EventPacket[] | undefined | null = get(data)) => {
    // 最新のデータを常に保存

    // すでに更新スケジュールがあれば追加で予約しない
    if (isUpdateScheduled) {
      return;
    }

    // 実際の更新処理をスケジュール
    isUpdateScheduled = true;

    // 現在更新中でなければすぐに処理、更新中なら更新完了後に処理
    if (!updating) {
      scheduleUpdate();
    }
  };
  /**
   * 更新処理をスケジュール
   */
  function scheduleUpdate() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (destroyed) {
        updating = false;
        $nowProgress = false;
        return;
      }
      processUpdate();
    }, UPDATE_DELAY);
  }
  /**
   * Updates the view with current events
   */
  function processUpdate(_data: EventPacket[] | undefined | null = get(data)) {
    try {
      updating = true;

      const olderEvents: EventPacket[] | undefined = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]);

      // Combine current and older events
      const allEvents = [...(_data || []), ...(olderEvents || [])];

      // Update the until timestamp for pagination

      // Filter and process events
      allUniqueEvents = allEvents
        .map((event) => event.event)
        .filter(eventFilter)
        .filter((event) => event.created_at <= now() + 10); // Exclude future events with small tolerance

      // Update the display with the current view window
      displayEvents.set(allUniqueEvents.slice(viewIndex, viewIndex + amount));

      // リセットフラグ
      isUpdateScheduled = false;
      //  }, UPDATE_DELAY);
    } catch (error) {
      console.error("Error during update", error);
      isUpdateScheduled = false;
    } finally {
      updating = false;
      $nowProgress = false;

      // 更新処理中に新しいデータが来た場合は再度更新をスケジュール
      // latestUpdateDataが更新された場合に再度処理を行う
      if (isUpdateScheduled) {
        scheduleUpdate();
      }
    }
  }

  /**
   * Initialize the timeline
   */
  async function initializeTimeline() {
    const existingEvents: EventPacket[] | undefined = queryClient?.getQueryData(
      [...queryKey, "olderData"]
    );

    // Only fetch older events if we don't already have them
    if (!existingEvents || existingEvents.length <= 0) {
      // Prepare filters for initial load
      const initialFilters: Nostr.Filter[] = olderFilters.map((filter) => ({
        ...filter,
        since: undefined,
        until:
          filters[0].until === undefined
            ? (filter.since ?? now())
            : filter.until,
        limit: LOAD_LIMIT,
      }));

      // Wait for relay connections if we have read URLs
      if (readUrls) {
        await waitForConnections(
          readUrls,
          relayStateMap.get(),
          CONNECTION_TIMEOUT
        );
      }

      // Fetch initial batch of events
      const olderEvents = await firstLoadOlderEvents(
        LOAD_LIMIT,
        initialFilters,
        tie,
        relays
      );

      // Store fetched events in query cache if we got any
      if (olderEvents.length > 0) {
        queryClient.setQueryData(
          [...queryKey, "olderData"],
          (oldData: EventPacket[] | undefined) => {
            // Deduplicate events using a Map
            return sortEventPackets(
              Array.from(
                new Map(
                  [...(oldData ?? []), ...olderEvents].map((packet) => [
                    packet.event.id,
                    packet,
                  ])
                ).values()
              )
            );
          }
        );
      }
    }

    // Update the view with all current events
    updateViewEvent();
  }

  /**
   * Load older events and move view down
   */
  const loadOlderAndMoveDown = async () => {
    $nowProgress = true;
    // Check if we need to load more events
    const needToLoadMore =
      !allUniqueEvents ||
      allUniqueEvents.length < viewIndex + amount + SLIDE_AMOUNT;

    if (needToLoadMore) {
      // Calculate how many events we need to fetch
      const fetchAmount =
        viewIndex + amount - (allUniqueEvents?.length || 0) + 5 * SLIDE_AMOUNT;

      const untilTime = allUniqueEvents[allUniqueEvents.length - 1].created_at;

      // Fetch older events
      const olderEvents = await loadOlderEvents(
        fetchAmount,
        olderFilters,
        untilTime,
        tie,
        relays
      );

      // Store fetched events in query cache if we got any
      if (olderEvents.length > 0) {
        queryClient.setQueryData(
          [...queryKey, "olderData"],
          (oldData: EventPacket[] | undefined) => {
            // Deduplicate events using a Map
            return sortEventPackets(
              Array.from(
                new Map(
                  [...(oldData ?? []), ...olderEvents].map((packet) => [
                    packet.event.id,
                    packet,
                  ])
                ).values()
              )
            );
          }
        );
      }
    }

    // Only move the view if we have enough events
    if (allUniqueEvents?.length >= viewIndex + amount - 10) {
      viewIndex += SLIDE_AMOUNT;
    }

    // Update the view with current events
    updateViewEvent(deriveaData);
  };

  /**
   * Move view up to more recent events
   */
  const moveUp = () => {
    if (viewIndex > 0) {
      // Slight scroll adjustment for better UX
      scroll({
        top: window.scrollY + 120,
      });

      // Update view index with minimum of 0
      viewIndex = Math.max(viewIndex - SLIDE_AMOUNT, 0);

      // Short delay to allow scroll to complete
      setTimeout(() => {
        updateViewEvent(deriveaData);
      }, 100);
    }
  };

  /**
   * Move view to the top (most recent events)
   */
  const moveToTop = () => {
    viewIndex = 0;
    updateViewEvent(deriveaData);
  };

  // Create query for older data
  createQuery({
    queryKey: [...queryKey, "olderData"],
    queryFn: undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Effects to handle data and state changes
  $effect(() => {
    // Update view when data changes or progress completes
    if ((deriveaData && viewIndex >= 0) || !$nowProgress) {
      untrack(() => updateViewEvent(deriveaData));
    }

    // Handle timeline filter changes
    if (timelineFilter.get()) {
      untrack(() => updateViewEvent(deriveaData));
      localStorage.setItem(
        "timelineFilter",
        JSON.stringify(timelineFilter.get())
      );
    }
  });

  // Lifecycle hooks
  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      $nowProgress = true;
      await initializeTimeline();
      isOnMount = false;
      $nowProgress = false;
    }
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      $nowProgress = true;
      await initializeTimeline();
      isOnMount = false;
      $nowProgress = false;
    }
  });

  onDestroy(() => {
    // Clean up resources if needed
    console.log("main timeline destroy");
    destroyed = true;
  });
</script>

{#if viewIndex !== 0}
  <div class=" w-full">
    <button
      class=" w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={() => moveToTop()}
      disabled={$nowProgress}
      ><SkipForward
        size={20}
        class="mx-auto -rotate-90 stroke-magnum-100 fill-magnum-100"
      /></button
    >
    <button
      disabled={$nowProgress}
      class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={() => moveUp()}
      ><Triangle
        size={20}
        class="mx-auto stroke-magnum-100 fill-magnum-100"
      /></button
    >
  </div>
{/if}
{#if $loginUser}<!--メニューのアイコンのとこがTLに自分が出てこないと取得されないけどMenuのとこにかいたらいつの時点から取得可能なのかわからなくてうまく取得できないからここにかいてみる…-->
  <Metadata queryKey={["metadata", $loginUser]} pubkey={$loginUser} />
{/if}
{#if $errorData}
  {@render error?.($errorData)}
{:else if displayEvents.get() && displayEvents.get().length > 0}
  {@render content?.({
    events: displayEvents.get(),
    status: $status,
    len: deriveaData?.length ?? 0,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
{#if displayEvents.get() && displayEvents.get().length > 0}
  <button
    disabled={$nowProgress}
    class=" rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
    onclick={() => loadOlderAndMoveDown()}
    ><Triangle
      size={20}
      class="rotate-180 stroke-magnum-100 fill-magnum-100"
    />Load more<Triangle
      size={20}
      class="rotate-180 stroke-magnum-100 fill-magnum-100"
    /></button
  >
{/if}
