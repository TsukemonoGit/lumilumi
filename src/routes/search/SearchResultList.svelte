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
    waitForRelayReady,
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
  const fetchAmount = 50; // 50 * 5;
  //これ50とってそこからさらに50だと取れるデータがfetchamount100とかにすると取れない
  // http://localhost:5173/search?q=author%3Anpub12egp0pvh2f0fp6sk5nt6ncehqzkz8zsma8dl8agf8p3f98v6resqku4w26+kind%3A1+until%3A2024-06-13T09%3A00
  //取得中のデータも表示するようにしたらそんなに読み込み遅くないような気がするから
  //とりあえず一回での取得量を減らしておく

  // イベントID に基づいて重複を排除する
  // const keyFn = (packet: EventPacket): string => packet.event.id;

  //const [uniq, eventIds] = createUniq(keyFn);
  const operator = pipe(
    tie,
    uniq(),
    userStatus(),
    /* reactionCheck(), */ scanArray()
  );
  $inspect(filters[0].until);
  let result = $derived(
    filters[0].until === undefined //untilがなかったら、未来の投稿も取得するためのレックを発行
      ? useSearchEventList(
          queryKey,
          $state.snapshot(filters).map((f) => ({
            ...f,
            since: now() - 15 * 60,
          })),
          operator,
          req,
          relays
        )
      : //untilがあったら、未来の投稿はいらないから適当にウメトク
        {
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
    console.log("dataChange");
    if ((data && index >= 0) || !progress) {
      updateViewEvent?.();
    }
  }

  let isOnMount = false;

  onMount(async () => {
    console.log("onMount");
    if (!isOnMount) {
      await init();
    }
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      console.log("afterNavigate");

      await init();
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
    if (isOnMount) {
      return;
    }
    isOnMount = true;

    const newFilters = $state.snapshot(
      filters.map((filter: Nostr.Filter) => ({
        ...filter,

        until: filter.until === undefined ? now() - 15 * 60 : filter.until,
      }))
    );
    await waitForRelayReady({ maxWaitTime: 5000 }); // 最大5秒待つ
    const older = await firstLoadOlderEvents(
      fetchAmount,
      newFilters,

      operator,
      relays,
      (partialData: EventPacket[]) => {
        if (partialData.length === 0) return;
        updateViewEvent(partialData);
      },
      5000
    );

    if (older.length > 0) {
      queryClient.setQueryData([...queryKey, "olderData"], () => older);
    }
    updateViewEvent();
    result.status = readable("success");

    isOnMount = false;
  }
  const handleNext = async () => {
    console.log("handleNext", viewIndex);
    let viewMoved = false;
    // console.log(length, viewIndex, amount, sift);
    if (
      !allUniqueEvents ||
      allUniqueEvents?.length < viewIndex + amount + sift
    ) {
      $nowProgress = true;

      const older = await loadOlderEvents(
        fetchAmount,
        filters,

        untilTime,
        operator,
        relays,
        (partialData) => {
          // console.log(partialData);
          if (partialData.length === 0) return;

          const stillNotEnough =
            allUniqueEvents.length + partialData.length <
            viewIndex + amount + sift + 10; //重複考慮

          if (!viewMoved && !stillNotEnough) {
            viewIndex += sift;
            viewMoved = true;
            updateViewEvent(partialData);
          }

          updateViewEvent(partialData);
        },
        5000
      );
      //console.log(older);
      if (older.length > 0) {
        updateQueryDataForOlder(older);
      }
    }
    // console.log(allUniqueEvents?.length);
    if (allUniqueEvents?.length >= viewIndex + amount - 10 && !viewMoved) {
      //表示量のイベントなかったらスライドしない
      viewIndex += sift; //スライドする量
    }
    updateViewEvent();
    $nowProgress = false;
  };

  const handlePrev = () => {
    console.log("handlePrev", viewIndex);
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - sift, 0);
    }
    updateViewEvent();
  };

  let debounceTimer: NodeJS.Timeout | null = null;
  const DEBOUNCE_TIME = 200; // 200ミリ秒
  function updateViewEvent(partialData?: EventPacket[] | undefined) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      update(partialData);
      debounceTimer = null;
    }, DEBOUNCE_TIME);
  }

  function update(partialData?: EventPacket[] | undefined) {
    const olderdatas: EventPacket[] | undefined = queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);
    //console.log(olderdatas);
    const allEvents = [...($data || []), ...(olderdatas || [])];
    // console.log("update", allEvents);

    const uniqueEvents = sortEvents(
      Array.from(
        new Map(
          [...allEvents, ...(partialData || [])].map((event) => [
            event.event.id,
            event.event,
          ])
        ).values()
      )
    );
    const allEv = uniqueEvents.filter(eventFilter);
    if (!partialData) {
      untilTime =
        allEvents.length > 0
          ? allEvents[allEvents.length - 1].event.created_at
          : now();
      //allUniqueEvents全イベント数の更新はpartialDataがないときだけ
      allUniqueEvents = allEv;
    }

    displayEvents.set(allEv.slice(viewIndex, viewIndex + amount));
  }

  function handleClickTop() {
    viewIndex = 0;
    updateViewEvent();
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
