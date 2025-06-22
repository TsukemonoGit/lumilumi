<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { onDestroy, onMount, untrack } from "svelte";
  import { get } from "svelte/store";
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

    eventFilter: (event: Nostr.Event) => boolean;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;
    content?: import("svelte").Snippet<
      [{ events: Nostr.Event<number>[]; status: ReqStatus; len: number }]
    >;
    updateViewEvent: (partialdata?: EventPacket[] | null | undefined) => void;
  }

  let {
    queryKey,
    filters,
    olderFilters,
    viewIndex,
    amount,
    relays = undefined,

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

  //過去イベントロードが完了してるかどうか
  let isLoadingOlderEvents: boolean = $state(false);

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
  /*   function registerTie(key: string) {
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
 */
  /**
   * 常に最新のイベントでビューを更新する関数
   * updating状態でも必ず最新データが反映されるようにする
   */
  let isUpdateScheduled: boolean = false;
  updateViewEvent = (partialdata?: EventPacket[] | null | undefined) => {
    // 最新のデータを常に保存

    // すでに更新スケジュールがあれば追加で予約しない
    if (isUpdateScheduled) {
      return;
    }

    // 実際の更新処理をスケジュール
    isUpdateScheduled = true;

    // 現在更新中でなければすぐに処理、更新中なら更新完了後に処理
    if (!updating) {
      scheduleUpdate(partialdata || []);
    }
  };

  const setAllEvents = (
    data: EventPacket[] | null | undefined,
    older: EventPacket[] | undefined,
    part: EventPacket[] | undefined
  ): EventPacket[] => {
    // Combine current and older events
    if (part && part.length > 0) {
      const seen = new Set();
      return [...(data || []), ...(older || []), ...(part || [])].filter(
        (pk) => {
          if (seen.has(pk.event.id)) return false;
          seen.add(pk.event.id);
          return true;
        }
      );
    } else {
      return [...(data || []), ...(older || [])];
    }
  };
  /**
   * 更新処理をスケジュール
   */
  function scheduleUpdate(partialdata?: EventPacket[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (destroyed) {
        updating = false;
        $nowProgress = false;
        return;
      }
      processUpdate(partialdata);
    }, UPDATE_DELAY);
  }
  /**
   * Updates the view with current events
   */
  function processUpdate(partialdata?: EventPacket[]) {
    try {
      updating = true;

      const olderEvents: EventPacket[] | undefined = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]);
      const allEvents: EventPacket[] = setAllEvents(
        $data,
        olderEvents,
        partialdata
      );

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
      currentEventCount = allUniqueEvents?.length || 0;
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
    try {
      const existingEvents: EventPacket[] | undefined =
        queryClient?.getQueryData([...queryKey, "olderData"]);

      // 既存データがある場合は早期リターン
      if (existingEvents && existingEvents.length > 0) {
        console.log(`既存データ${existingEvents.length}件を使用`);
        updateViewEvent();
        return;
      }

      // リレー接続を先に確立
      if (readUrls && readUrls.length > 0) {
        console.log("リレー接続を確立中...");
        await waitForConnections(
          readUrls,
          relayStateMap.get(),
          CONNECTION_TIMEOUT
        );
      }

      // フィルター準備を関数化
      const createInitialFilters = (): Nostr.Filter[] => {
        return olderFilters.map((filter) => ({
          ...filter,
          since: undefined,
          until: filters[0]?.until ?? filter.since ?? now(),
          limit: LOAD_LIMIT,
        }));
      };

      const initialFilters = createInitialFilters();

      // インクリメンタル更新ハンドラー（途中データはqueryに入れない）
      const handleIncrementalData = (partialData: EventPacket[]) => {
        if (partialData.length === 0) return;

        // console.log(`${partialData.length}件受信`);

        // 途中データをupdateViewEventに渡す
        updateViewEvent(partialData);
      };

      console.log("初期データを取得中...");

      // 初期データを取得
      const olderEvents = await firstLoadOlderEvents(
        LOAD_LIMIT,
        initialFilters,
        tie,
        relays,
        handleIncrementalData
      );

      // 最終データをqueryに保存
      if (olderEvents.length > 0) {
        queryClient.setQueryData(
          [...queryKey, "olderData"],
          (oldData: EventPacket[] | undefined) => {
            const deduplicatedData = sortEventPackets(
              Array.from(
                new Map(
                  [...(oldData ?? []), ...olderEvents].map((packet) => [
                    packet.event.id,
                    packet,
                  ])
                ).values()
              )
            );

            return LOAD_LIMIT > 0
              ? deduplicatedData.slice(0, LOAD_LIMIT)
              : deduplicatedData;
          }
        );
      }

      console.log(`初期化完了: ${olderEvents.length}件のイベントを取得`);
    } catch (error) {
      console.error("Timeline初期化エラー:", error);

      // エラー時でも既存データがあれば表示
      const fallbackData = queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]) as EventPacket[];
      if (fallbackData && fallbackData.length > 0) {
        console.log("フォールバックデータを使用");
      }
    } finally {
      // 最終的なビュー更新（途中データなし）
      updateViewEvent();
    }
  }
  let currentEventCount: number = $state(0);
  let requiredEventCount: number = $state(viewIndex + amount + SLIDE_AMOUNT);

  let loadMoreDisabled = $derived(
    $nowProgress ||
      (isLoadingOlderEvents && currentEventCount < requiredEventCount)
  );

  /**
   * Load older events and move view down
   */
  const loadOlderAndMoveDown = async () => {
    if ($nowProgress) return;

    $nowProgress = true;
    let viewMoved = false;

    try {
      // 十分なイベントがある場合は即座にビュー移動
      if (currentEventCount >= requiredEventCount + SLIDE_AMOUNT) {
        viewIndex += SLIDE_AMOUNT;
        updateViewEvent();
        return;
      }
      if (isLoadingOlderEvents) {
        console.log("前回のデータ取得が完了していません");
        return;
      }
      isLoadingOlderEvents = true;
      const fetchAmount =
        requiredEventCount - currentEventCount + 6 * SLIDE_AMOUNT;
      const untilTime =
        allUniqueEvents?.[allUniqueEvents.length - 1]?.created_at;

      if (!untilTime) {
        console.warn("No existing events to determine untilTime");
        return;
      }

      // インクリメンタル更新のハンドラー（途中データはqueryに入れない）
      const handleIncrementalData = (partialData: EventPacket[]) => {
        if (partialData.length === 0) return;

        // console.log(`${partialData.length}件受信`);

        // 途中データも含めて十分かチェック（queryデータ + 途中データ）
        // この判定はupdateViewEvent内で計算された結果を使う必要があるかも
        const totalCount = currentEventCount + partialData.length;
        if (!viewMoved && totalCount >= viewIndex + amount + SLIDE_AMOUNT) {
          viewIndex += SLIDE_AMOUNT;
          viewMoved = true;
        }
        updateViewEvent(partialData); // ビュー移動後に再更新
      };

      // 古いイベントを取得
      const olderEvents = await loadOlderEvents(
        fetchAmount,
        olderFilters,
        untilTime,
        tie,
        relays,
        handleIncrementalData
      );

      // 最終データをqueryに保存
      if (olderEvents.length > 0) {
        queryClient.setQueryData(
          [...queryKey, "olderData"],
          (oldData: EventPacket[] | undefined) => {
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

      // // 最終チェック：まだ移動していない場合
      if (
        !viewMoved &&
        allUniqueEvents?.length >= viewIndex + amount - 10 + SLIDE_AMOUNT
      ) {
        viewIndex += SLIDE_AMOUNT;
      }

      // console.log(`${olderEvents.length}件の追加イベントを取得完了`);
    } catch (error) {
      console.error("loadOlderAndMoveDown error:", error);
    } finally {
      // 最終更新（途中データなし）
      updateViewEvent();
      $nowProgress = false;
      isLoadingOlderEvents = false;
      requiredEventCount = viewIndex + amount + SLIDE_AMOUNT;
    }
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
{#if lumiSetting.get().pubkey}<!--メニューのアイコンのとこがTLに自分が出てこないと取得されないけどMenuのとこにかいたらいつの時点から取得可能なのかわからなくてうまく取得できないからここにかいてみる…-->
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
    len: deriveaData?.length ?? 0,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
{#if displayEvents.get() && displayEvents.get().length > 0}
  <button
    disabled={loadMoreDisabled}
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
