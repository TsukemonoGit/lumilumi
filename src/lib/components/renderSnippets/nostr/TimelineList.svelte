<!--メインTL以外のTL（グローバルとか、リストとか、ユーザーページのやつとか）-->
<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import {
    defaultRelays,
    loginUser,
    nowProgress,
    queryClient,
    tieMapStore,
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
  import {
    createTie,
    now,
    type DefaultRelayConfig,
    type EventPacket,
  } from "rx-nostr";
  import Metadata from "./Metadata.svelte";
  import { onDestroy, onMount, untrack } from "svelte";
  import { pipe, type OperatorFunction } from "rxjs";
  import { createUniq } from "rx-nostr/src";
  import {
    displayEvents,
    relayStateMap,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import { scanArray } from "$lib/stores/operators";
  import { formatAbsoluteDate } from "$lib/func/util";

  // Configuration constants
  const SCROLL_AMOUNT = 40; // Amount to slide/scroll
  const MAX_WAIT_TIME = 5000; // Maximum wait time for relay connections (10 seconds)
  const BATCH_SIZE = 50; // Number of events to fetch per batch
  const UPDATE_DELAY = 50; // Delay for update events to prevent continuous execution

  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    olderFilters: Nostr.Filter[];
    req?: any;
    viewIndex?: number;
    amount: number;
    relays?: string[] | undefined;
    tieKey: string;
    eventFilter?: (event: Nostr.Event) => boolean;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;
    content?: import("svelte").Snippet<
      [{ events: Nostr.Event<number>[]; status: ReqStatus; len: number }]
    >;
    updateViewEvent?: (_data?: EventPacket[] | undefined | null) => void;
    resetUniq?: () => void;
  }

  let {
    queryKey,
    filters,
    olderFilters,
    req,
    viewIndex = 0,
    amount,
    relays = undefined,
    tieKey,
    eventFilter = () => true,
    error,
    loading,
    nodata,
    content,
    updateViewEvent = $bindable(),
    resetUniq = $bindable(),
  }: Props = $props();

  // State variables
  let updating: boolean = false;
  let timeoutId: NodeJS.Timeout | null = null;
  let isOnMount = false;
  let allUniqueEvents: Nostr.Event[];
  let readUrls: string[] = [];
  let olderQueryKey = $derived([...queryKey, "olderData"]);
  let destroyed = false;
  onDestroy(() => {
    console.log("timeline destroy");
    destroyed = true;
    // 他のクリーンアップ処理
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

  // Create tie and uniq for event handling
  let tie: OperatorFunction<
    EventPacket,
    EventPacket & {
      seenOn: Set<string>;
      isNew: boolean;
    }
  >;
  let tieMap: Map<string, Set<string>>;

  const keyFn = (packet: EventPacket): string => packet.event.id;
  const onCache = (packet: EventPacket): void => {
    // Event observed for the first time
  };
  const onHit = (packet: EventPacket): void => {
    // Event has already been observed
  };
  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });

  // Create the timeline event list
  let result = useTimelineEventList(
    queryKey,
    filters,
    configureOperators(),
    req,
    relays
  );
  let globalData = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);

  // Update the view with current events
  updateViewEvent = (data: EventPacket[] | undefined | null = $globalData) => {
    if (updating) return;

    updating = true;
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      if (destroyed) {
        updating = false;
        $nowProgress = false;
        return;
      }
      const olderData: EventPacket[] | undefined =
        queryClient.getQueryData(olderQueryKey);
      const allEvents: EventPacket[] = [...(data || []), ...(olderData || [])];

      allUniqueEvents = allEvents
        .map((event) => event.event)
        .filter(eventFilter)
        .filter((event) => event.created_at <= now() + 10); // Exclude future events (with small tolerance)

      displayEvents.set(allUniqueEvents.slice(viewIndex, viewIndex + amount));

      updating = false;
      $nowProgress = false;
    }, UPDATE_DELAY);
  };

  function configureOperators() {
    registerTie(tieKey);
    return pipe(tie, uniq, scanArray());
  }

  resetUniq = () => {
    eventIds.clear();
  };
  /**
   * Registers the tie in the global store
   */
  function registerTie(key: string) {
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

  // Effect to handle reactive state changes
  $effect(() => {
    if ($defaultRelays) {
      untrack(() => updateRelayUrls($defaultRelays));
    }
  });
  $effect(() => {
    if (($globalData && viewIndex >= 0) || !$nowProgress) {
      untrack(() => dataChange($globalData, viewIndex, $nowProgress));
    }
  });

  // Update relay URLs when default relays change
  function updateRelayUrls(relays: Record<string, DefaultRelayConfig>) {
    if (relays) {
      readUrls = Object.values(relays)
        .filter((config) => config.read)
        .map((config) => config.url);
    }
  }

  // Handle data changes
  function dataChange(
    data: EventPacket[] | null | undefined,
    index: number,
    progress: boolean
  ) {
    if ((data && index >= 0) || !progress) {
      updateViewEvent?.(data);
    }
  }

  // Initialize the component
  async function init() {
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
        limit: BATCH_SIZE,
      }));

      // Wait for relay connections before proceeding
      await waitForConnections(readUrls, relayStateMap.get(), MAX_WAIT_TIME);

      const olderEvents = await firstLoadOlderEvents(
        BATCH_SIZE,
        newFilters,
        tie,
        relays
      );

      if (olderEvents.length > 0) {
        queryClient.setQueryData(
          olderQueryKey,
          (oldData: EventPacket[] | undefined) => [
            ...(oldData ?? []),
            ...olderEvents,
          ]
        );

        setTimeout(() => {
          updateViewEvent?.($globalData);
        }, 10);
      }
    }
  }

  // Lifecycle hooks
  onMount(async () => {
    if (!isOnMount) {
      $nowProgress = true;
      isOnMount = true;
      await init();
      isOnMount = false;
      $nowProgress = false;
    }
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      $nowProgress = true;
      isOnMount = true;
      await init();
      isOnMount = false;
      $nowProgress = false;
    }
  });

  // UI action handlers
  const handleNext = async () => {
    $nowProgress = true;
    const untilTime = allUniqueEvents[allUniqueEvents.length - 1].created_at;
    console.log(
      "allUniqueEvents.length:",
      allUniqueEvents.length,
      formatAbsoluteDate(untilTime)
    );
    if (
      !allUniqueEvents ||
      allUniqueEvents.length < viewIndex + amount + SCROLL_AMOUNT
    ) {
      const requiredAmount =
        viewIndex + amount - (allUniqueEvents?.length || 0) + 5 * SCROLL_AMOUNT;

      // Using the freshly calculated untilTime
      const globalolderEvents = await loadOlderEvents(
        requiredAmount,
        olderFilters,
        untilTime,
        tie,
        relays
      );

      if (globalolderEvents.length > 0) {
        queryClient.setQueryData(
          olderQueryKey,
          (oldData: EventPacket[] | undefined) => {
            const existingEvents = oldData ?? [];
            const allPackets = [...existingEvents, ...globalolderEvents];

            // Remove duplicates based on event ID
            const uniqueEvents = Array.from(
              new Map(
                allPackets.map((packet) => [packet.event.id, packet])
              ).values()
            );

            // Sort events by timestamp
            return uniqueEvents.sort(
              (a, b) => b.event.created_at - a.event.created_at
            );
          }
        );
      }
    }

    if (allUniqueEvents?.length >= viewIndex + amount - 10) {
      viewIndex += SCROLL_AMOUNT;
    }

    updateViewEvent?.($globalData);
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      scroll({
        top: window.scrollY + 120,
      });

      viewIndex = Math.max(viewIndex - SCROLL_AMOUNT, 0);

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

{#if $loginUser}
  <Metadata queryKey={["metadata", $loginUser]} pubkey={$loginUser} />
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
    disabled={$nowProgress}
    class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
    onclick={() => handleNext()}
  >
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
    Load more
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
  </button>
{/if}
