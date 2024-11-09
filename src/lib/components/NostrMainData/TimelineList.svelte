<script lang="ts">
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import {
    defaultRelays,
    loginUser,
    nowProgress,
    queryClient,
    relayStateMap,
    showReactioninTL,
    showUserStatus,
    slicedEvent,
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
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import Metadata from "./Metadata.svelte";
  import { onDestroy, onMount } from "svelte";
  import { sortEvents } from "$lib/func/util";
  import { userStatus, reactionCheck, scanArray } from "$lib/stores/operators";
  import { pipe } from "rxjs";
  import { createUniq } from "rx-nostr/src";

  const sift = 40; //スライドする量

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
  export let olderFilters: Nostr.Filter[];
  // export let lastfavcheck: boolean = true;
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined = undefined;
  export let viewIndex: number = 0;
  export let amount: number; //1ページに表示する量
  export let eventFilter: (event: Nostr.Event) => boolean = () => true; // デフォルトフィルタ
  export let relays: string[] | undefined = undefined; //emitにしていするいちじりれー
  // export let tie: OperatorFunction<
  //   EventPacket,
  //   EventPacket & {
  //     seenOn: Set<string>;
  //     isNew: boolean;
  //   }
  // >;

  export let tieKey: string;

  createQuery({
    queryKey: [...queryKey, "olderData"],
    queryFn: undefined,
    staleTime: Infinity, // 4 hour
    gcTime: Infinity, // 4 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const [tie, tieMap] = createTie();
  $: if (tieKey) {
    //$tieMapStore = { undefined: undefined };
    if (!$tieMapStore) {
      $tieMapStore = { [tieKey]: [tie, tieMap] };
    } else if (!$tieMapStore?.[tieKey]) {
      $tieMapStore = { ...$tieMapStore, [tieKey]: [tie, tieMap] };
    }
  }

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
  $: operator = setOperator();

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
  $: result = useTimelineEventList(queryKey, filters, operator, req, relays);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  let readUrls: string[] = [];
  $: if ($defaultRelays) {
    readUrls = Object.values($defaultRelays)
      .filter((config) => config.read)
      .map((config) => config.url);
  }
  $: if (($data && viewIndex >= 0) || !$nowProgress) {
    updateViewEvent($data);
  }
  //$: console.log($data);
  // beforeNavigate((navigate) => {
  //   console.log("beforeNavigate", navigate.type);
  //   if (navigate.type !== "form") {
  //     $slicedEvent = [];
  //   }
  // });

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
    const ev: EventPacket[] | undefined = $queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);

    //if (ev) {
    //   console.log(ev);

    //  updateViewEvent($data);

    //   //olderEventsから、今の時間までのあいだのイベントをとるやつ
    //   const newFilters = filters.map((filter: Nostr.Filter) => ({
    //     ...filter,
    //     since: ev[0].event.created_at,
    //     until: now(),
    //   }));
    //   const older = await firstLoadOlderEvents(0, newFilters, queryKey, relays);
    //   if (older.length > 0) {
    //     $queryClient.setQueryData(
    //       [...queryKey, "olderData"],
    //       [...ev, ...older]
    //     );
    //   }
    //   updateViewEvent($data);
    //   }

    if (!ev || ev?.length <= 0) {
      // const newFilters = filters.map((filter: Nostr.Filter) => ({
      //   ...filter,
      //   since: undefined,
      //   until:
      //     filter.until === undefined ? (filter.since ?? now()) : filter.until,
      //   limit: 50,
      // }));
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
      await waitForConnections(readUrls, $relayStateMap, 10000); // maxWaitTime set to 10 seconds
      console.log($relayStateMap);

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
        updateViewEvent($data);
      }
    }
  }

  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus; len: number };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
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
  let untilTime: number;
  let updating: boolean = false;
  let timeoutId: NodeJS.Timeout | null = null;
  export let updateViewEvent = (data: EventPacket[] | undefined = $data) => {
    if (updating) {
      return;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      updating = true;

      const olderdatas: EventPacket[] | undefined = $queryClient.getQueryData([
        ...queryKey,
        "olderData",
      ]);
      console.log("updateViewEvent");
      const allEvents = data ?? [];
      if (olderdatas) {
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

      slicedEvent.update((value) =>
        allUniqueEvents.slice(viewIndex, viewIndex + amount)
      );
      updating = false;
    }, 50); // 連続で実行されるのを防ぐ
    //console.log($slicedEvent);
  };

  function handleClickTop() {
    viewIndex = 0;
    updateViewEvent($data);
  }

  onDestroy(() => {
    console.log("test");
  });
</script>

{#if viewIndex !== 0}
  <div class=" w-full">
    <button
      class=" w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      on:click={() => handleClickTop()}
      disabled={$nowProgress}
      ><SkipForward
        size={20}
        class="mx-auto -rotate-90 stroke-magnum-100 fill-magnum-100"
      /></button
    >
    <button
      disabled={$nowProgress}
      class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
      on:click={() => handlePrev()}
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
{#if $error}
  <slot name="error" error={$error} />
{:else if $slicedEvent && $slicedEvent?.length > 0}
  <slot events={$slicedEvent} status={$status} len={$data?.length ?? 0} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
{#if $slicedEvent && $slicedEvent?.length > 0}
  <button
    disabled={$nowProgress}
    class=" rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-100 gap-2 my-1 hover:opacity-75"
    on:click={() => handleNext()}
    ><Triangle
      size={20}
      class="rotate-180 stroke-magnum-100 fill-magnum-100"
    />Load more<Triangle
      size={20}
      class="rotate-180 stroke-magnum-100 fill-magnum-100"
    /></button
  >
{/if}
