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
  import type { ReqStatus, RxReqBase } from "$lib/types";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { Filter, SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";
  import { firstLoadOlderEvents, loadOlderEvents } from "./timelineList";
  import {
    createTie,
    type EventPacket,
    type RxReq,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { type OperatorFunction } from "rxjs";
  import Metadata from "./Metadata.svelte";
  import { browser } from "$app/environment";
  import { setTieKey } from "$lib/func/nostr";
  import { onMount } from "svelte";

  const sift = 40; //スライドする量

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
  export let lastfavcheck: boolean = true;
  export let req:
    | RxReqBase
    | (RxReq<"backward"> & {
        emit(
          filters: Filter | Filter[],
          options?:
            | {
                relays: string[];
              }
            | undefined
        ): void;
      } & RxReqOverable &
        RxReqPipeable)
    | undefined = undefined;
  export let viewIndex: number;
  export let amount: number; //1ページに表示する量
  export let eventFilter: (event: EventPacket) => boolean = () => true; // デフォルトフィルタ
  export let relays: string[] | undefined = undefined; //emitにしていするいちじりれー
  // export let tie: OperatorFunction<
  //   EventPacket,
  //   EventPacket & {
  //     seenOn: Set<string>;
  //     isNew: boolean;
  //   }
  // >;

  export let tieKey: string;
  const [tie, tieMap] = createTie();
  if (!$tieMapStore) {
    $tieMapStore = { [tieKey]: [tie, tieMap] };
  } else if (!$tieMapStore[tieKey]) {
    $tieMapStore = { ...$tieMapStore, [tieKey]: [tie, tieMap] };
  }
  // export let lastVisible: Element | null;
  let allUniqueEvents: EventPacket[];
  $: result = useTimelineEventList(
    queryKey,
    filters,
    $tieMapStore[tieKey][0],
    req,
    relays
  );
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  let slicedEvent: Nostr.Event[];
  let readUrls: string[] = [];
  let olderEvents: EventPacket[] = [];
  $: if ($defaultRelays) {
    readUrls = Object.values($defaultRelays)
      .filter((config) => config.read)
      .map((config) => config.url);
  }
  $: if ($data && viewIndex >= 0 && olderEvents) {
    updateViewEvent($data);
  }

  onMount(async () => {
    console.log("onMount");
    const ev: EventPacket[] | undefined = $queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);
    if (ev) {
      olderEvents = ev;
      updateViewEvent($data);
    }

    if (olderEvents?.length <= 0) {
      $nowProgress = true;
      const older = await firstLoadOlderEvents(50, filters, queryKey);

      olderEvents.push(...older);
      $queryClient.setQueryData([...queryKey, "olderData"], olderEvents);
      updateViewEvent($data);
      $nowProgress = false;
    }
  });

  afterNavigate(async () => {
    console.log("afterNavigate");
    const ev: EventPacket[] | undefined = $queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);
    if (ev) {
      olderEvents = ev;
      updateViewEvent($data);
    }
    if (olderEvents?.length <= 0) {
      const older = await firstLoadOlderEvents(50, filters, queryKey);

      olderEvents.push(...older);
      $queryClient.setQueryData([...queryKey, "olderData"], olderEvents);
      updateViewEvent($data);
      $nowProgress = false;
    }
  });

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
      $nowProgress = true;
      const older = await loadOlderEvents(
        sift,
        allUniqueEvents,
        filters,
        queryKey,
        lastfavcheck
      );

      olderEvents.push(...older);
      $queryClient.setQueryData([...queryKey, "olderData"], olderEvents);
    }
    viewIndex += sift; //スライドする量
    updateViewEvent($data);
    $nowProgress = false;
    // console.log(viewIndex);
    //スマホではスクロールちゃんとなってたからでかいときだけやる
    if (window.innerWidth > 640) {
      //px
      const lastVisibleElement = document?.querySelector(".last-visible");
      setTimeout(() => {
        //データが更新終わるのを待ってからスライドしてみる
        if (lastVisibleElement) {
          lastVisibleElement.scrollIntoView({ block: "end" });
        }
      }, 10);
    }
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - sift, 0);
    }

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
    const allEvents = data ? [...data, ...olderEvents] : olderEvents;
    // console.log(allEvents);
    allEvents.sort((a, b) => b.event.created_at - a.event.created_at);
    const uniqueEventsMap: { [x: string]: boolean } = {};
    const uniqueEvents = [];
    for (const event of allEvents) {
      if (!uniqueEventsMap[event.event.id]) {
        uniqueEventsMap[event.event.id] = true;
        uniqueEvents.push(event);
      }
    }
    allUniqueEvents = uniqueEvents;
    // console.log(viewIndex);
    slicedEvent = uniqueEvents
      // ?.filter(
      //   (packet) => readUrls.includes(packet.from) && eventFilter(packet)
      // ) // デフォルトリレーに含まれるかチェック
      .map(({ event }) => event)
      .slice(viewIndex, viewIndex + amount);
    //  console.log(slicedEvent);
  }

  function handleClickTop() {
    viewIndex = 0;
  }
</script>

{#if viewIndex !== 0}
  <div class="p-1 w-full">
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
  </div>
{/if}
{#if $loginUser}<!--メニューのアイコンのとこがTLに自分が出てこないと取得されないけどMenuのとこにかいたらいつの時点から取得可能なのかわからなくてうまく取得できないからここにかいてみる…-->
  <Metadata queryKey={["metadata", $loginUser]} pubkey={$loginUser} />
{/if}
{#if $error}
  <slot name="error" error={$error} />
{:else if slicedEvent && slicedEvent?.length > 0}
  <slot events={slicedEvent} status={$status} len={$data?.length ?? 0} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
<div class="p-1 w-full mb-16">
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
</div>
