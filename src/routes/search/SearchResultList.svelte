<script lang="ts">
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import {
    defaultRelays,
    loginUser,
    nowProgress,
    queryClient,
    slicedEvent,
    tieMapStore,
  } from "$lib/stores/stores";
  import { useTimelineEventList } from "$lib/stores/useTimelineEventList";
  import type { ReqStatus } from "$lib/types";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";
  import {
    createUniq,
    now,
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
    createTie,
  } from "rx-nostr";
  import { onDestroy, onMount } from "svelte";
  import {
    firstLoadOlderEvents,
    loadOlderEvents,
  } from "$lib/components/NostrMainData/timelineList";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { readable } from "svelte/store";
  import { sortEvents } from "$lib/func/util";
  import { userStatus, reactionCheck, scanArray } from "$lib/stores/operators";
  import { pipe } from "rxjs";

  const sift = 40; //スライドする量

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined = undefined;
  export let viewIndex: number;
  export let amount: number; //1ページに表示する量
  export let eventFilter: (event: Nostr.Event) => boolean = () => true; // デフォルトフィルタ
  export let relays: string[] | undefined = undefined; //emitにしていするいちじりれー
  export let tieKey: string;
  // export let tie: OperatorFunction<
  //   EventPacket,
  //   EventPacket & {
  //     seenOn: Set<string>;
  //     isNew: boolean;
  //   }
  // >;

  // export let lastVisible: Element | null;
  let allUniqueEvents: Nostr.Event[];

  // イベントID に基づいて重複を排除する
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const onCache = (packet: EventPacket): void => {
    //console.log(`${packet.event.id} を初めて観測しました`);
  };
  const onHit = (packet: EventPacket): void => {
    //  console.log(`${packet.event.id} はすでに観測されています`);
  };

  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });
  const operator = pipe(uniq, userStatus(), reactionCheck(), scanArray());
  //sinceとuntilは両方undefinedか、両方値あり。
  //で設定ある場合はリアルタイムのイベントは必要ないから$dataは常に空
  const reqFilters = filters.map((filter: Nostr.Filter) => ({
    ...filter,
    since: filter.since === undefined ? now() : filter.since,

    limit: 50,
  }));
  $: result =
    filters[0].since === undefined
      ? useTimelineEventList(queryKey, reqFilters, operator, req, relays)
      : {
          data: undefined,
          status: readable("loading" as ReqStatus),
          error: undefined,
        };
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
  $: console.log($data);
  beforeNavigate((navigate) => {
    console.log("beforeNavigate", navigate.type);
    $slicedEvent = [];
  });

  let isOnMount = false;

  const [tie, tieMap] = createTie();
  $: if (tieKey) {
    //$tieMapStore = { undefined: undefined };
    if (!$tieMapStore) {
      $tieMapStore = { [tieKey]: [tie, tieMap] };
    } else if (!$tieMapStore?.[tieKey]) {
      $tieMapStore = { ...$tieMapStore, [tieKey]: [tie, tieMap] };
    }
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

  afterNavigate(async () => {
    if (!isOnMount) {
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

    if (ev) {
      console.log(ev);

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
    }

    if (!ev || ev?.length <= 0) {
      const newFilters = filters.map((filter: Nostr.Filter) => ({
        ...filter,

        until: filter.until === undefined ? now() : filter.until,
        limit: 50,
      }));
      const older = await firstLoadOlderEvents(
        50,
        newFilters,
        queryKey,
        tie,
        relays
      );

      if (older.length > 0) {
        const olddata: EventPacket[] | undefined = $queryClient.getQueryData([
          ...queryKey,
          "olderData",
        ]);

        $queryClient.setQueryData(
          [...queryKey, "olderData"],
          [...(olddata ?? []), ...older]
        );
      }
      result.status = readable("success");
    }
  }

  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus; len: number };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
  let untilTime: number;
  const handleNext = async () => {
    // console.log(length, viewIndex, amount, sift);
    if (
      !allUniqueEvents ||
      allUniqueEvents?.length < viewIndex + amount + sift
    ) {
      //viewIndexは表示される最初のインデックスで今表示されてるものの最後のインデックスが＋５０でそれぷらす20なかったらロードする
      //500
      $nowProgress = true;
      const syutokusururyou =
        viewIndex + amount - allUniqueEvents?.length + 5 * sift; //一回分だと４０くらいしか取らないのもなんかもったいないけど無駄にいっぱい取るのもなんかもったいないし40*5=200件分くらい取る？
      //limitで最大何個くらいまで取れるんだろうの最小値//500件くらいじゃなかったっけ(リレーによる)
      const older = await loadOlderEvents(
        syutokusururyou,
        filters,
        queryKey,
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
    // console.log(allUniqueEvents?.length);
    if (allUniqueEvents?.length >= viewIndex + amount - 10) {
      //表示量のイベントなかったらスライドしない
      viewIndex += sift; //スライドする量
    }
    updateViewEvent($data);
    $nowProgress = false;
    // console.log(viewIndex);
    //スマホではスクロールちゃんとなってたからでかいときだけやる
    // if (window.innerWidth > 640) {
    //   //px
    //   const lastVisibleElement = document?.querySelector(".last-visible");
    //   setTimeout(() => {
    //     //データが更新終わるのを待ってからスライドしてみる
    //     if (lastVisibleElement) {
    //       lastVisibleElement.scrollIntoView({ block: "end" });
    //     }
    //   }, 10);
    // }
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - sift, 0);
    }
    updateViewEvent($data);
    //スマホではスクロールちゃんとなってたからでかいときだけやる
    if (window.innerWidth > 640) {
      //px

      const firstVisibleElement = document?.querySelector(".first-visible");
      setTimeout(() => {
        //データが更新終わるのを待ってからスライドしてみる
        if (firstVisibleElement) {
          firstVisibleElement.scrollIntoView(true);
        }
      }, 10);
    }
  };

  function updateViewEvent(data: EventPacket[] | undefined) {
    const olderdatas: EventPacket[] | undefined = $queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);
    console.log("test");
    const allEvents =
      data && olderdatas ? [...data, ...olderdatas] : (olderdatas ?? []);

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

    slicedEvent.update((value) =>
      allUniqueEvents.slice(viewIndex, viewIndex + amount)
    );

    console.log($slicedEvent);
  }

  function handleClickTop() {
    viewIndex = 0;
    updateViewEvent($data);
  }

  onDestroy(() => {
    console.log("test");
  });
</script>

{#if viewIndex !== 0}
  <button
    class=" w-full rounded-md bg-magnum-600 py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-200 gap-2 my-1 hover:opacity-75"
    on:click={() => handleClickTop()}
    disabled={$nowProgress}
    ><SkipForward
      size={20}
      class="mx-auto -rotate-90 stroke-magnum-200 fill-magnum-200"
    /></button
  >

  <button
    disabled={$nowProgress}
    class="rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-200 gap-2 my-1 hover:opacity-75"
    on:click={() => handlePrev()}
    ><Triangle
      size={20}
      class="mx-auto stroke-magnum-200 fill-magnum-200"
    /></button
  >
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
    class=" rounded-md bg-magnum-600 w-full py-2 disabled:opacity-25 flex justify-center items-center font-bold text-lg text-magnum-200 gap-2 my-1 hover:opacity-75"
    on:click={() => handleNext()}
    ><Triangle
      size={20}
      class="rotate-180 stroke-magnum-200 fill-magnum-200"
    />Load more<Triangle
      size={20}
      class="rotate-180 stroke-magnum-200 fill-magnum-200"
    /></button
  >
{/if}
