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
    createUniq,
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
  } from "$lib/components/renderSnippets/nostr/timelineList";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { readable } from "svelte/store";
  import { sortEvents } from "$lib/func/util";
  import { userStatus, reactionCheck, scanArray } from "$lib/stores/operators";
  import { pipe } from "rxjs";
  import { displayEvents, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { useSearchEventList } from "$lib/stores/useSearchEventList";

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
  let reqFilters = $derived(
    filters.map((filter: Nostr.Filter) => ({
      ...filter,
      since: filter.since === undefined ? now() : filter.since,

      limit: 50,
    }))
  );
  let result = $derived(
    filters[0].since === undefined
      ? useSearchEventList(queryKey, reqFilters, operator, req, relays)
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
  if ($defaultRelays) {
    readUrls = Object.values($defaultRelays)
      .filter((config) => config.read)
      .map((config) => config.url);
  }
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

  async function init() {
    const ev: EventPacket[] | undefined = queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);

    if (!ev || ev?.length <= 0) {
      const newFilters = filters.map((filter: Nostr.Filter) => ({
        ...filter,

        until: filter.until === undefined ? now() : filter.until,
        limit: 50,
      }));
      const older = await firstLoadOlderEvents(
        50,
        newFilters,

        tie,
        relays
      );

      if (older.length > 0) {
        queryClient.setQueryData(
          [...queryKey, "olderData"],
          (olddata: EventPacket[] | undefined) => [...(olddata ?? []), ...older]
        );
      }
      updateViewEvent($data);
      result.status = readable("success");
    }
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
      const syutokusururyou =
        viewIndex + amount - allUniqueEvents?.length + 5 * sift; //一回分だと４０くらいしか取らないのもなんかもったいないけど無駄にいっぱい取るのもなんかもったいないし40*5=200件分くらい取る？
      //limitで最大何個くらいまで取れるんだろうの最小値//500件くらいじゃなかったっけ(リレーによる)
      const older = await loadOlderEvents(
        syutokusururyou,
        filters,

        untilTime,
        tie,
        relays
      );
      console.log(older);
      if (older.length > 0) {
        queryClient.setQueryData(
          [...queryKey, "olderData"],
          (olderdatas: EventPacket[] | undefined) => [
            ...(olderdatas ?? []),
            ...older,
          ]
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

  function updateViewEvent(data: EventPacket[] | undefined | null) {
    const olderdatas: EventPacket[] | undefined = queryClient.getQueryData([
      ...queryKey,
      "olderData",
    ]);
    // console.log("test");
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

    displayEvents.set(allUniqueEvents.slice(viewIndex, viewIndex + amount));

    //  console.log($slicedEvent);
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
