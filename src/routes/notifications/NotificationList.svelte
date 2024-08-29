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
    createTie,
    now,
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { setTieKey } from "$lib/func/nostr";
  import { onDestroy, onMount } from "svelte";
  import { sortEvents } from "$lib/func/util";
  import {
    firstLoadOlderEvents,
    loadOlderEvents,
  } from "$lib/components/NostrMainData/timelineList";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  const sift = 40; //スライドする量

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
  export let lastfavcheck: boolean = true;
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
  // export let tie: OperatorFunction<
  //   EventPacket,
  //   EventPacket & {
  //     seenOn: Set<string>;
  //     isNew: boolean;
  //   }
  // >;

  export let tieKey: string | undefined = undefined;
  export let selectedTab: string; //どのタブにいるときに▲🔻をおしたかをあれするよう

  const [tie, tieMap] = createTie();
  $: if (!tieKey || tieKey) {
    setTieKey(tieKey ?? "undefined");
    if (!tieKey) {
      //$tieMapStore = { undefined: undefined };
    } else if (!$tieMapStore) {
      $tieMapStore = { [tieKey]: [tie, tieMap] };
    } else if (!$tieMapStore?.[tieKey]) {
      $tieMapStore = { ...$tieMapStore, [tieKey]: [tie, tieMap] };
    }
  }
  // export let lastVisible: Element | null;
  let allUniqueEvents: Nostr.Event[];

  $: result = useTimelineEventList(
    queryKey,
    filters,

    req,
    relays
  );
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
  beforeNavigate(() => {
    $slicedEvent = [];
  });

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
        since: undefined,
        until: filter.until === undefined ? now() : filter.until,
        limit: 50,
      }));
      const older = await firstLoadOlderEvents(
        50,
        newFilters,
        queryKey,
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
    }
  }

  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus; len: number };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }

  const handleNext = async () => {
    console.log(selectedTab);
    return;
    // console.log(length, viewIndex, amount, sift);
    if (
      !allUniqueEvents ||
      allUniqueEvents?.length < viewIndex + amount + sift
    ) {
      //viewIndexは表示される最初のインデックスで今表示されてるものの最後のインデックスが＋５０でそれぷらす20なかったらロードする
      $nowProgress = true;
      const older = await loadOlderEvents(
        sift,
        filters,
        queryKey,
        lastfavcheck,
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
    if (allUniqueEvents?.length >= viewIndex + amount) {
      //表示量のイベントなかったらスライドしない
      viewIndex += sift; //スライドする量
    }

    updateViewEvent($data);
    $nowProgress = false;
    // console.log(viewIndex);
    // //スマホではスクロールちゃんとなってたからでかいときだけやる
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
    // //スマホではスクロールちゃんとなってたからでかいときだけやる
    // if (window.innerWidth > 640) {
    //   //px

    //   const firstVisibleElement = document?.querySelector(".first-visible");
    //   setTimeout(() => {
    //     //データが更新終わるのを待ってからスライドしてみる
    //     if (firstVisibleElement) {
    //       firstVisibleElement.scrollIntoView(true);
    //     }
    //   }, 10);
    // }
  };

  function updateViewEvent(data: EventPacket[] | undefined) {
    const olderdatas: EventPacket[] | undefined = $queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);
    console.log("test");
    const allEvents =
      data && olderdatas ? [...data, ...olderdatas] : olderdatas ?? [];
    const uniqueEvents = sortEvents(
      Array.from(
        new Map(
          allEvents.map((event) => [event.event.id, event.event])
        ).values()
      )
    ); //.sort((a, b) => b.event.created_at - a.event.created_at);

    allUniqueEvents = uniqueEvents;

    slicedEvent.update((value) =>
      uniqueEvents
        .filter(eventFilter)
        .filter((event) => event.created_at <= now() + 10) // 未来のイベントを除外 ちょっとだけ許容

        .slice(viewIndex, viewIndex + amount)
    );

    //console.log($slicedEvent);
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
