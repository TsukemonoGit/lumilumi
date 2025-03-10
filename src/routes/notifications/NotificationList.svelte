<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import {
    defaultRelays,
    loginUser,
    nowProgress,
    onlyFollowee,
    queryClient,
    tieMapStore,
  } from "$lib/stores/stores";

  import {
    type QueryKey,
    createQuery,
    QueryObserver,
    type QueryObserverResult,
  } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";

  import { createTie, now, type EventPacket } from "rx-nostr";

  import { onDestroy, onMount } from "svelte";
  import { debounce, sortEvents } from "$lib/func/util";
  import { scanArray } from "$lib/stores/operators";
  import { pipe } from "rxjs";
  import { createUniq } from "rx-nostr/src";
  import {
    waitForConnections,
    loadOlderEvents,
  } from "$lib/components/renderSnippets/nostr/timelineList";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { usePromiseReq } from "$lib/func/nostr";
  import { writable, type Writable } from "svelte/store";
  import { displayEvents, relayStateMap } from "$lib/stores/globalRunes.svelte";
  import { page } from "$app/state";

  const sift = 40; //スライドする量

  let untilTime: number;

  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    // export let lastfavcheck: boolean = true;
    viewIndex: number;
    amount: number; //1ページに表示する量
    eventFilter?: (event: Nostr.Event) => boolean; // デフォルトフィルタ
    relays?: string[] | undefined; //emitにしていするいちじりれー
    // >;
    tieKey: string;
    updateViewNotifi?: any;
    children?: import("svelte").Snippet<[any]>;
  }

  let {
    queryKey,
    filters,
    viewIndex = $bindable(),
    amount,
    eventFilter = () => true,
    relays = undefined,
    tieKey,
    updateViewNotifi = $bindable<() => void>(),
    children,
  }: Props = $props();

  updateViewNotifi = debounce(async () => {
    console.log(page.route);
    if (page.route.id !== "/notifications") {
      return;
    }
    $nowProgress = true;
    console.log("updateViewNotifi");
    const allEvents: EventPacket[] | undefined =
      queryClient.getQueryData(queryKey);

    if (!allEvents) {
      return;
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

    allUniqueNotifi = uniqueEvents
      .filter(eventFilter)
      .filter((event) => event.created_at <= now() + 10); // 未来のイベントを除外 ちょっとだけ許容;

    displayEvents.set(allUniqueNotifi.slice(viewIndex, viewIndex + amount));
    // $slicedEvent = $slicedEvent;

    // console.timeEnd();
    $nowProgress = false;
  }, 20);

  createQuery({
    queryKey: queryKey,
    queryFn: undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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
  let allUniqueNotifi: Nostr.Event[];

  // $: result = useTimelineEventList(queryKey, filters, operator, req, relays);
  const observer = new QueryObserver(queryClient, {
    queryKey: queryKey,
  });
  const data: Writable<EventPacket[]> = writable<EventPacket[]>();
  observer.subscribe((result: QueryObserverResult<unknown, Error>) => {
    // console.log(result);
    if (result.data) {
      $data = result.data as EventPacket[];
    }
  });

  // $: status = result.status;
  // $: error = result.error;
  let readUrls: string[] = $derived.by(() => {
    if ($defaultRelays) {
      return Object.values($defaultRelays)
        .filter((config) => config.read)
        .map((config) => config.url);
    }
    return [];
  }); //.raw([]);
  //$: console.log(data);
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

      isOnMount = true;
      await init();
    }
  });

  afterNavigate(async (navigate) => {
    console.log("afterNavigate", navigate.type);
    if (navigate.type !== "form" && !isOnMount) {
      console.log("afterNavigate");

      isOnMount = true;
      await init();
    }
  });

  async function init() {
    // const ev: EventPacket[] | undefined = queryClient.getQueryData(queryKey);
    $nowProgress = true;
    console.log(readUrls);

    //readUrlsのうち８割がconnectedになるまで待ってから、以下の処理を行う
    // Wait until 80% of readUrls are connected or max wait time is reached (e.g., 10 seconds)

    await waitForConnections(readUrls, relayStateMap.get(), 5000); // maxWaitTime set to 10 seconds
    // console.log(relayStateMap.get);

    const older = await usePromiseReq(
      { filters: filters, operator, req: undefined },
      undefined
    );

    console.log("first older", older);
    if (older.length > 0) {
      const olderdata = filters[0].limit
        ? older.slice(0, filters[0].limit)
        : older; //sinceとuntilがめっちゃ離れてるときのこと考えてない

      queryClient.setQueryData(
        //古いやつより新しいやつ
        queryKey,
        (before: EventPacket[] | undefined) => [...olderdata, ...(before ?? [])]
      );
      // console.log(queryClient.getQueryData(queryKey));
    }
    $nowProgress = false;
    isOnMount = false;
    // updateViewNotifi();
  }

  interface $$Slots {
    default: { events: Nostr.Event[]; len: number };
  }

  const handleNext = async () => {
    // console.log(length, viewIndex, amount, sift);
    if (
      !allUniqueNotifi ||
      allUniqueNotifi?.length < viewIndex + amount + sift
    ) {
      //viewIndexは表示される最初のインデックスで今表示されてるものの最後のインデックスが＋５０でそれぷらす20なかったらロードする
      const syutokusururyou =
        viewIndex + amount - allUniqueNotifi?.length + 5 * sift; //一回分だと４０くらいしか取らないのもなんかもったいないけど無駄にいっぱい取るのもなんかもったいないし40*5=200件分くらい取る？
      //nevent1qvzqqqqqqypzqv33pxtldvmmdntqhv269r56zjadmhalpp660h3yc6gj8gxpuexvqyv8wumn8ghj7cn0wd68ytnwda4k7arpwfhjucm0d5qs6amnwvaz7tmev9382tndv5q3zamnwvaz7tmj9e4k76nfwfsju6t0qyxhwumn8ghj7mn0wvhxcmmvqqszykcw73dgzvupxwnktv7lvndtn5n4rxwzas7jm88zkh3zpknkqws0ayy00
      $nowProgress = true;
      const older = await loadOlderEvents(
        syutokusururyou, //４０（sift）にしてても39とかになって微妙に足りてない時がある（なんで？）から//同じイベント取って省かれてるとか？
        filters,

        //lastfavcheck,
        untilTime,
        tie,
        relays
      );
      console.log(older);
      if (older.length > 0) {
        queryClient.setQueryData(
          queryKey,
          (before: EventPacket[] | undefined) => [...(before ?? []), ...older]
        );
      }
    }
    //console.log(allUniqueNotifi?.length);
    if (allUniqueNotifi?.length >= viewIndex + amount - 10) {
      //４０にしてても39とかになって微妙に足りてない時がある（なんで？）から
      //表示量のイベントなかったらスライドしない
      viewIndex += sift; //スライドする量
    }

    updateViewNotifi();
    $nowProgress = false;
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      scroll({
        top: 120,
      });
      viewIndex = Math.max(viewIndex - sift, 0);
      setTimeout(() => {
        updateViewNotifi();
      }, 100);
    }
  };

  function handleClickTop() {
    viewIndex = 0;
    updateViewNotifi();
  }

  onDestroy(() => {
    console.log("test");
  });
  // run(() => {
  if (tieKey) {
    //$tieMapStore = { undefined: undefined };
    if (!$tieMapStore) {
      $tieMapStore = { [tieKey]: [tie, tieMap] };
    } else if (!$tieMapStore?.[tieKey]) {
      $tieMapStore = { ...$tieMapStore, [tieKey]: [tie, tieMap] };
    }
  }
  // });
  let operator = $derived(pipe(tie, uniq, scanArray()));

  //表示更新---

  data.subscribe((value) => {
    if (value && value.length > 0 && (viewIndex >= 0 || !$nowProgress)) {
      updateViewNotifi();
    }
  });

  onlyFollowee.subscribe((value) => {
    updateViewNotifi();
  });

  //------
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

{#if displayEvents.get() && displayEvents.get()?.length > 0}
  {@render children?.({ events: displayEvents.get(), len: $data?.length ?? 0 })}
{/if}
{#if displayEvents.get() && displayEvents.get().length > 0}
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
