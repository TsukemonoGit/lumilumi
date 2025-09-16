<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { nowProgress, queryClient, tie } from "$lib/stores/stores";
  import {
    type QueryKey,
    createQuery,
    QueryObserver,
    type QueryObserverResult,
  } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";
  import { now, type EventPacket } from "rx-nostr";
  import { createUniq } from "rx-nostr/src";
  import { onDestroy, onMount } from "svelte";
  import { writable, type Writable } from "svelte/store";
  import { pipe } from "rxjs";

  import { debounce, sortEvents } from "$lib/func/util";
  import { scanArray } from "$lib/stores/operators";
  import {
    waitForConnections,
    loadOlderEvents,
  } from "$lib/components/renderSnippets/nostr/timelineList";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { usePromiseReq } from "$lib/func/nostr";
  import {
    displayEvents,
    lumiSetting,
    notifiSettings,
  } from "$lib/stores/globalRunes.svelte";

  // Constants
  const SLIDE_AMOUNT = 40; // Amount to slide when navigating
  const PREFETCH_MULTIPLIER = 5; // How many slides ahead to prefetch

  // Interface definitions
  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    viewIndex: number;
    amount: number; // Number of items to display per page
    eventFilter?: (event: Nostr.Event) => boolean;
    relays?: string[];

    updateViewNotifi?: () => void;
    children?: import("svelte").Snippet<[any]>;
  }

  let {
    queryKey,
    filters,
    viewIndex = $bindable(),
    amount,
    eventFilter = () => true,
    relays = undefined,

    updateViewNotifi = $bindable<() => void>(),
    children,
  }: Props = $props();

  // State
  let untilTime: number;
  let allUniqueNotifi: Nostr.Event[] = $state([]);
  let isOnMount = false;

  // Create unique events filter
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const [uniq, eventIds] = createUniq(keyFn);

  // Setup query operator
  let operator = $derived(pipe(tie, uniq, scanArray()));

  // Initialize query
  createQuery({
    queryKey: queryKey,
    queryFn: undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Observer setup for query data changes
  const observer = new QueryObserver(queryClient, { queryKey });
  const data: Writable<EventPacket[]> = writable<EventPacket[]>();
  observer.subscribe((result: QueryObserverResult<unknown, Error>) => {
    if (result.data) {
      $data = result.data as EventPacket[];
    }
  });

  // Define update view function with debounce
  updateViewNotifi = debounce(async () => {
    // Return early if not on notifications page
    if (page.route.id !== "/notifications") {
      return;
    }

    // Get all events from query cache
    const allEvents: EventPacket[] | undefined =
      queryClient.getQueryData(queryKey);
    if (!allEvents) {
      return;
    }
    $nowProgress = true;
    // Set time marker for pagination
    untilTime =
      allEvents.length > 0
        ? allEvents[allEvents.length - 1].event.created_at
        : now();

    // Process and filter events
    const uniqueEvents = sortEvents(
      Array.from(
        new Map(
          allEvents.map((event) => [event.event.id, event.event])
        ).values()
      )
    );

    // Apply filters
    allUniqueNotifi = uniqueEvents
      .filter(eventFilter)
      .filter((event) => event.created_at <= now() + 10); // Filter out future events with small tolerance

    // Update display events
    displayEvents.set(allUniqueNotifi.slice(viewIndex, viewIndex + amount));

    $nowProgress = false;
  }, 20);

  // Lifecycle hooks
  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await initializeTimeline();
    }
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      await initializeTimeline();
    }
  });

  onDestroy(() => {
    // Cleanup code if needed
  });

  // Update view when data changes
  data.subscribe((value) => {
    if (value && value.length > 0 && (viewIndex >= 0 || !$nowProgress)) {
      updateViewNotifi();
    }
  });

  // Update view when follow filter changes
  notifiSettings.subscribe(() => {
    updateViewNotifi();
  });

  // Timeline initialization
  async function initializeTimeline() {
    $nowProgress = true;

    try {
      // Wait for relay connections
      await waitForConnections();

      // Load initial events
      const olderEvents = await usePromiseReq(
        { filters, operator, req: undefined },
        undefined
      );

      if (olderEvents.length > 0) {
        const limitedOlderEvents = filters[0].limit
          ? olderEvents.slice(0, filters[0].limit)
          : olderEvents;

        // Update query data with fetched events
        queryClient.setQueryData(
          queryKey,
          (before: EventPacket[] | undefined) => [
            ...limitedOlderEvents,
            ...(before ?? []),
          ]
        );
      }
    } catch (error) {
      console.error("Failed to initialize timeline:", error);
    } finally {
      $nowProgress = false;
      isOnMount = false;
    }
  }

  // Navigation handlers
  async function handleLoadMore() {
    if (
      !allUniqueNotifi ||
      allUniqueNotifi.length < viewIndex + amount + SLIDE_AMOUNT
    ) {
      $nowProgress = true;

      try {
        // Calculate how many events to fetch
        const fetchAmount =
          viewIndex +
          amount -
          (allUniqueNotifi?.length || 0) +
          PREFETCH_MULTIPLIER * SLIDE_AMOUNT;

        // Load older events
        const olderEvents = await loadOlderEvents(
          fetchAmount,
          filters.map((filter) => {
            return { ...filter, since: undefined };
          }),
          untilTime,
          tie,
          relays
        );

        if (olderEvents.length > 0) {
          // Update query data with fetched events
          queryClient.setQueryData(
            queryKey,
            (before: EventPacket[] | undefined) => [
              ...(before ?? []),
              ...olderEvents,
            ]
          );
        }
      } catch (error) {
        console.error("Failed to load more events:", error);
      } finally {
        $nowProgress = false;
      }
    }

    // Only advance if we have enough events to display
    if (allUniqueNotifi?.length >= viewIndex + amount - 10) {
      viewIndex += SLIDE_AMOUNT;
      updateViewNotifi();
    }
  }

  function handlePrevious() {
    if (viewIndex > 0) {
      // Scroll to top of timeline
      scroll({ top: 120 });

      // Update view index
      viewIndex = Math.max(viewIndex - SLIDE_AMOUNT, 0);

      // Update view after a slight delay to allow for smooth scrolling
      setTimeout(() => {
        updateViewNotifi();
      }, 100);
    }
  }

  function handleScrollToTop() {
    viewIndex = 0;
    updateViewNotifi();
  }
</script>

{#if viewIndex !== 0}
  <div class="w-full">
    <button
      class="w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={() => handleScrollToTop()}
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
      onclick={() => handlePrevious()}
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

{#if displayEvents.get() && displayEvents.get()?.length > 0}
  {@render children?.({ events: displayEvents.get(), len: $data?.length ?? 0 })}
{/if}

{#if (displayEvents.get() && displayEvents.get().length > 0) || (allUniqueNotifi.length > 0 && viewIndex === 0)}
  <button
    disabled={$nowProgress}
    class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
    onclick={() => handleLoadMore()}
  >
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
    Load more
    <Triangle size={20} class="rotate-180 stroke-magnum-100 fill-magnum-100" />
  </button>
{/if}
