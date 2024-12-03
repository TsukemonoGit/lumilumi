<!-- @migration-task Error while migrating Svelte code: Cannot subscribe to stores that are not declared at the top level of the component -->
<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import {
    defaultRelays,
    loginUser,
    nowProgress,
    queryClient,
    relayStateMap,
    showReactioninTL,
    showUserStatus,
    tieMapStore,
    timelineFilter,
  } from "$lib/stores/stores";

  import type { ReqStatus } from "$lib/types";
  import { type QueryKey, createQuery } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";
  import {
    firstLoadOlderEvents,
    loadOlderEvents,
    waitForConnections,
  } from "./timelineList";
  import { createTie, now, type EventPacket } from "rx-nostr";
  import Metadata from "./Metadata.svelte";
  import { onDestroy, onMount, untrack } from "svelte";
  import { sortEvents } from "$lib/func/util";
  import { userStatus, reactionCheck, scanArray } from "$lib/stores/operators";
  import { pipe } from "rxjs";
  import { createUniq } from "rx-nostr/src";

  import { useMainTimeline } from "$lib/stores/useMainTimeline";
  import { get } from "svelte/store";
  import { displayEvents } from "$lib/stores/displayTLEvents.svelte";

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

  // export let queryKey: QueryKey;
  // export let filters: Nostr.Filter[];
  // export let olderFilters: Nostr.Filter[];

  // export let viewIndex: number;
  // export let amount: number; //1ページに表示する量
  // export let eventFilter: (event: Nostr.Event) => boolean = () => true; // デフォルトフィルタ
  // export let relays: string[] | undefined = undefined; //emitにしていするいちじりれー

  // export let tieKey: string;

  const sift = 40; //スライドする量

  const [tie, tieMap] = createTie();

  // イベントID に基づいて重複を排除する
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const onCache = (packet: EventPacket): void => {
    //console.log(`${packet.event.id} を初めて観測しました`);
  };
  const onHit = (packet: EventPacket): void => {
    //  console.log(`${packet.event.id} はすでに観測されています`);
  };

  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });
  // export let lastVisible: Element | null;

  let allUniqueEvents: Nostr.Event[];

  let result = useMainTimeline(queryKey, setOperator(), filters);
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);

  let readUrls = $derived.by(() => {
    if ($defaultRelays) {
      return Object.values($defaultRelays)
        .filter((config) => config.read)
        .map((config) => config.url);
    }
  });

  let isOnMount = false;

  let untilTime: number;
  let updating: boolean = false;
  let timeoutId: NodeJS.Timeout | null = null;

  updateViewEvent = (_data: EventPacket[] | undefined | null = get(data)) => {
    if (updating) {
      return;
    }
    updating = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const olderdatas: EventPacket[] | undefined = $queryClient?.getQueryData([
        ...queryKey,
        "olderData",
      ]);
      console.log("updateViewEvent");
      const allEvents = _data ?? [];
      if (olderdatas && olderdatas.length > 0) {
        allEvents.push(...olderdatas);
      }
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
      ); //.sort((a, b) => b.event.created_at - a.event.created_at);

      allUniqueEvents = uniqueEvents
        .filter(eventFilter)
        .filter((event) => event.created_at <= now() + 10); // 未来のイベントを除外 ちょっとだけ許容;

      displayEvents.set(allUniqueEvents.slice(viewIndex, viewIndex + amount));
      updating = false;
    }, 50); // 連続で実行されるのを防ぐ
    //console.log($slicedEvent);
  };

  createQuery({
    queryKey: [...queryKey, "olderData"],
    queryFn: undefined,
    staleTime: Infinity, // 4 hour
    gcTime: Infinity, // 4 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // data?.subscribe((value) => {
  //   if (updateViewEvent && ((value && viewIndex >= 0) || !$nowProgress)) {
  //     updateViewEvent(value);
  //   }
  // });

  let deriveaData = $derived($data);

  $effect(() => {
    if ((deriveaData && viewIndex >= 0) || !$nowProgress)
      untrack(() => dataChange(deriveaData, viewIndex, $nowProgress));
  });

  function dataChange(
    data: EventPacket[] | null | undefined,
    index: number,
    progress: boolean
  ) {
    if ((data && index >= 0) || !progress) {
      updateViewEvent(data);
    }
  }

  $effect(() => {
    if (tieKey) {
      untrack(() => setTie(tieKey));
    }
  });

  function setTie(_tieKey: string) {
    if (_tieKey) {
      //$tieMapStore = { undefined: undefined };
      if (!$tieMapStore) {
        $tieMapStore = { [_tieKey]: [tie, tieMap] };
      } else if (!$tieMapStore?.[_tieKey]) {
        $tieMapStore = { ...$tieMapStore, [_tieKey]: [tie, tieMap] };
      }
    }
  }
  // if (tieKey) {
  //   //$tieMapStore = { undefined: undefined };
  //   if (!$tieMapStore) {
  //     $tieMapStore = { [tieKey]: [tie, tieMap] };
  //   } else if (!$tieMapStore?.[tieKey]) {
  //     $tieMapStore = { ...$tieMapStore, [tieKey]: [tie, tieMap] };
  //   }
  // }

  function setOperator() {
    let operator = pipe(tie, uniq);
    if (tieKey === "timeline" && $showUserStatus) {
      //めいんTLのとき
      operator = pipe(operator, userStatus());
    }
    if (tieKey === "timeline" && $showReactioninTL) {
      operator = pipe(operator, reactionCheck());
    }
    //最後に配列にする
    return pipe(operator, scanArray());
  }

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
    console.log(navigate);
    console.log("afterNavigate", navigate.type);
    if (navigate.type !== "form" && !isOnMount) {
      console.log("afterNavigate");
      $nowProgress = true;
      isOnMount = true;
      await init();
      isOnMount = false;
      $nowProgress = false;
    }
  });

  async function init() {
    const ev: EventPacket[] | undefined = $queryClient?.getQueryData([
      ...queryKey,
      "olderData",
    ]);

    if (!ev || ev?.length <= 0) {
      const newFilters: Nostr.Filter[] = olderFilters.map((filter) => {
        return {
          ...filter,
          since: undefined,
          until:
            filters[0].until === undefined
              ? (filter.since ?? now())
              : filter.until,
          limit: 50,
        };
      });
      console.log(readUrls);

      //readUrlsのうち８割がconnectedになるまで待ってから、以下の処理を行う
      // Wait until 80% of readUrls are connected or max wait time is reached (e.g., 10 seconds)
      if (readUrls) {
        await waitForConnections(readUrls, $relayStateMap, 10000);
      } // maxWaitTime set to 10 seconds
      // console.log($relayStateMap);

      const older = await firstLoadOlderEvents(
        50,
        newFilters,

        tie,
        relays
      );
      console.log("first older", older);
      if (older.length > 0) {
        const olddata: EventPacket[] | undefined = $queryClient.getQueryData([
          ...queryKey,
          "olderData",
        ]);

        $queryClient.setQueryData(
          [...queryKey, "olderData"],
          [...(olddata ?? []), ...older]
        );
        //updateViewEvent($data);
      }
    }
    updateViewEvent();
  }

  const handleNext = async () => {
    // console.log(length, viewIndex, amount, sift);
    if (
      !allUniqueEvents ||
      allUniqueEvents?.length < viewIndex + amount + sift
    ) {
      //viewIndexは表示される最初のインデックスで今表示されてるものの最後のインデックスが＋５０でそれぷらす20なかったらロードする
      const syutokusururyou =
        viewIndex + amount - allUniqueEvents?.length + 5 * sift; //一回分だと４０くらいしか取らないのもなんかもったいないけど無駄にいっぱい取るのもなんかもったいないし40*5=200件分くらい取る？
      //nevent1qvzqqqqqqypzqv33pxtldvmmdntqhv269r56zjadmhalpp660h3yc6gj8gxpuexvqyv8wumn8ghj7cn0wd68ytnwda4k7arpwfhjucm0d5qs6amnwvaz7tmev9382tndv5q3zamnwvaz7tmj9e4k76nfwfsju6t0qyxhwumn8ghj7mn0wvhxcmmvqqszykcw73dgzvupxwnktv7lvndtn5n4rxwzas7jm88zkh3zpknkqws0ayy00
      $nowProgress = true;
      const older = await loadOlderEvents(
        syutokusururyou, //４０（sift）にしてても39とかになって微妙に足りてない時がある（なんで？）から//同じイベント取って省かれてるとか？
        olderFilters,

        //lastfavcheck,
        untilTime,
        tie,
        relays
      );
      console.log(older);
      if (older.length > 0) {
        const olderdatas: EventPacket[] | undefined = $queryClient.getQueryData(
          [...queryKey, "olderData"]
        );
        $queryClient.setQueryData(
          [...queryKey, "olderData"],
          [...(olderdatas ?? []), ...older]
        );
      }
    }
    //console.log(allUniqueEvents?.length);
    if (allUniqueEvents?.length >= viewIndex + amount - 10) {
      //４０にしてても39とかになって微妙に足りてない時がある（なんで？）から
      //表示量のイベントなかったらスライドしない
      viewIndex += sift; //スライドする量
    }

    updateViewEvent($data);
    $nowProgress = false;
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      scroll({
        top: window.scrollY + 120,
      });

      viewIndex = Math.max(viewIndex - sift, 0);
      setTimeout(() => {
        updateViewEvent($data);
      }, 100);
    }
  };

  function handleClickTop() {
    viewIndex = 0;
    updateViewEvent($data);
  }

  onDestroy(() => {
    console.log("test");
  });
  // $inspect($slicedEvent);

  timelineFilter.subscribe((value) => {
    if (value) {
      updateViewEvent($data);
      localStorage.setItem("timelineFilter", JSON.stringify(value));
    }
  });
</script>

{#if viewIndex !== 0}
  <div class=" w-full">
    <button
      class=" w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={() => handleClickTop()}
      disabled={$nowProgress}
      ><SkipForward
        size={20}
        class="mx-auto -rotate-90 stroke-magnum-100 fill-magnum-100"
      /></button
    >
    <button
      disabled={$nowProgress}
      class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      onclick={() => handlePrev()}
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
{:else if displayEvents.get && displayEvents.get.length > 0}
  {@render content?.({
    events: displayEvents.get,
    status: $status,
    len: $data?.length ?? 0,
  })}
  <!-- <slot events={$slicedEvent} status={$status} len={$data?.length ?? 0} /> -->
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
{#if displayEvents.get && displayEvents.get.length > 0}
  <button
    disabled={$nowProgress}
    class=" rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
    onclick={() => handleNext()}
    ><Triangle
      size={20}
      class="rotate-180 stroke-magnum-100 fill-magnum-100"
    />Load more<Triangle
      size={20}
      class="rotate-180 stroke-magnum-100 fill-magnum-100"
    /></button
  >
{/if}
