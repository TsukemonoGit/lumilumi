<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import {
    defaultRelays,
    nowProgress,
    queryClient,
    tie,
  } from "$lib/stores/stores";

  import type { ReqStatus } from "$lib/types";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";
  import {
    /*  createUniq, */
    uniq,
    now,
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { onDestroy, onMount, untrack } from "svelte";
  import {
    firstLoadOlderEvents,
    loadOlderEvents,
    waitForConnections,
  } from "$lib/components/renderSnippets/nostr/timelineList";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { readable } from "svelte/store";
  import { sortEvents } from "$lib/func/util";
  import { userStatus, scanArray } from "$lib/stores/operators";
  import { pipe } from "rxjs";
  import { displayEvents, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { useSearchEventList } from "$lib/stores/useSearchEventList";
  import { sortEventPackets } from "$lib/func/util";
  const sift = 40; //スライドする量
  let untilTime: number = 0;

  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    viewIndex: number;
    amount: number;
    req: RxReq<"forward"> & RxReqEmittable & RxReqPipeable;
    relays?: string[];

    eventFilter?: (event: Nostr.Event) => boolean;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    children?: import("svelte").Snippet<
      [{ events: Nostr.Event<number>[]; status: ReqStatus; len: number }]
    >;
  }
  let {
    queryKey,
    filters,
    viewIndex,
    amount,
    req,
    relays = undefined,

    eventFilter = () => true,
    error,
    loading,
    nodata,
    children,
  }: Props = $props();

  // export let lastVisible: Element | null;
  let allUniqueEvents: Nostr.Event[];
  const fetchAmount = 250; // 50 * 5;
  // イベントID に基づいて重複を排除する
  // const keyFn = (packet: EventPacket): string => packet.event.id;

  //const [uniq, eventIds] = createUniq(keyFn);
  const operator = pipe(
    tie,
    uniq(),
    userStatus(),
    /* reactionCheck(), */ scanArray()
  );

  let result = $derived(
    filters[0].until !== undefined
      ? useSearchEventList(
          queryKey,
          $state.snapshot(filters),
          operator,
          req,
          relays
        )
      : {
          data: undefined,
          status: readable("loading" as ReqStatus),
          error: undefined,
        }
  );
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
  let readUrls: string[] = [];
  $effect(() => {
    if ($defaultRelays) {
      readUrls = Object.values($defaultRelays)
        .filter((config) => config.read)
        .map((config) => config.url);
    }
  });
  $effect(() => {
    if (($data && viewIndex >= 0) || !$nowProgress) {
      untrack(() => dataChange($data, viewIndex, $nowProgress));
    }
  });

  function dataChange(
    data: EventPacket[] | null | undefined,
    index: number,
    progress: boolean
  ) {
    if ((data && index >= 0) || !progress) {
      updateViewEvent?.(data);
    }
  }

  let isOnMount = false;

  onMount(async () => {
    if (!isOnMount) {
      console.log("onMount");
      $nowProgress = true;
      isOnMount = true;
      await init();
      isOnMount = false;
      $nowProgress = false;
    }
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      console.log("afterNavigate");
      $nowProgress = true;
      isOnMount = true;
      await init();
      isOnMount = false;
      $nowProgress = false;
    }
  });
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
  async function init() {
    const newFilters = filters.map((filter: Nostr.Filter) => ({
      ...filter,

      until: filter.until === undefined ? now() : filter.until,
    }));
    await waitForConnections();
    const older = await firstLoadOlderEvents(
      fetchAmount,
      newFilters,

      operator,
      relays,
      undefined,
      5000
    );

    if (older.length > 0) {
      // data にない id を除外
      const existingIds = new Set(($data ?? []).map((p) => p.event.id));
      const filtered = older.filter((p) => !existingIds.has(p.event.id));

      queryClient.setQueryData([...queryKey, "olderData"], () => filtered);
    }
    updateViewEvent($data);
    result.status = readable("success");
  }

  const handleNext = async () => {
    // console.log(length, viewIndex, amount, sift);
    if (
      !allUniqueEvents ||
      allUniqueEvents?.length < viewIndex + amount + sift
    ) {
      //viewIndexは表示される最初のインデックスで今表示されてるものの最後のインデックスが＋５０でそれぷらす20なかったらロードする
      //500
      $nowProgress = true;

      const older = await loadOlderEvents(
        fetchAmount,
        filters,

        untilTime,
        operator,
        relays,
        undefined,
        5000
      );
      console.log(older);
      if (older.length > 0) {
        updateQueryDataForOlder(older);
      }
    }
    // console.log(allUniqueEvents?.length);
    if (allUniqueEvents?.length >= viewIndex + amount - 10) {
      //表示量のイベントなかったらスライドしない
      viewIndex += sift; //スライドする量
    }
    updateViewEvent($data);
    $nowProgress = false;
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - sift, 0);
    }
    updateViewEvent($data);
  };

  let debounceTimer: NodeJS.Timeout | null = null;
  const DEBOUNCE_TIME = 200; // 200ミリ秒
  function updateViewEvent(data?: EventPacket[] | undefined | null) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      update(data);
      debounceTimer = null;
    }, DEBOUNCE_TIME);
  }

  function update(data?: EventPacket[] | undefined | null) {
    const olderdatas: EventPacket[] | undefined = queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);
    //console.log(olderdatas);
    const allEvents = [...(data || []), ...(olderdatas || [])];

    untilTime =
      allEvents.length > 0
        ? allEvents[allEvents.length - 1].event.created_at
        : now();
    const uniqueEvents = sortEvents(
      Array.from(
        new Map(
          allEvents.map((event) => [event.event.id, event.event])
        ).values()
      )
    );

    allUniqueEvents = uniqueEvents.filter(eventFilter);

    displayEvents.set(allUniqueEvents.slice(viewIndex, viewIndex + amount));
  }

  function handleClickTop() {
    viewIndex = 0;
    updateViewEvent($data);
  }

  onDestroy(() => {
    console.log("onDestroy");
  });
</script>

{#if viewIndex !== 0}
  <button
    class=" w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-200 gap-2 my-1 hover:opacity-75"
    onclick={() => handleClickTop()}
    disabled={$nowProgress}
    ><SkipForward
      size={20}
      class="mx-auto -rotate-90 stroke-magnum-200 fill-magnum-200"
    /></button
  >

  <button
    disabled={$nowProgress}
    class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-200 gap-2 my-1 hover:opacity-75"
    onclick={() => handlePrev()}
    ><Triangle
      size={20}
      class="mx-auto stroke-magnum-200 fill-magnum-200"
    /></button
  >
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
  {@render children?.({
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
    disabled={$nowProgress}
    class=" rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-200 gap-2 my-1 hover:opacity-75"
    onclick={() => handleNext()}
    ><Triangle
      size={20}
      class="rotate-180 stroke-magnum-200 fill-magnum-200"
    />Load more<Triangle
      size={20}
      class="rotate-180 stroke-magnum-200 fill-magnum-200"
    /></button
  >
{/if}
