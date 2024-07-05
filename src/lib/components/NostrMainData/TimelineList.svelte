<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { defaultRelays, nowProgress } from "$lib/stores/stores";
  import { useTimelineEventList } from "$lib/stores/useTimelineEventList";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { Filter, SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";
  import { loadOlderEvents } from "./timelineList";
  import {
    type EventPacket,
    type RxReq,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { type OperatorFunction } from "rxjs";

  const sift = 40; //スライドする量

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
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
  export let tie: OperatorFunction<
    EventPacket,
    EventPacket & {
      seenOn: Set<string>;
      isNew: boolean;
    }
  >;
  $: result = useTimelineEventList(queryKey, filters, tie, req, relays);
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

  afterNavigate(() => {
    viewIndex = 0;
    if ($data) {
      slicedEvent = $data
        ?.filter(
          (packet) => readUrls.includes(packet.from) && eventFilter(packet)
        ) // デフォルトリレーに含まれるかチェック
        .map(({ event }) => event)
        .slice(viewIndex, viewIndex + amount);
    }
  });

  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus; len: number };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }

  const handleNext = async () => {
    if ($data && $data.length > 1 && $data.length < viewIndex + amount + sift) {
      //viewIndexは表示される最初のインデックスで今表示されてるものの最後のインデックスが＋５０でそれぷらす20なかったらロードする
      $nowProgress = true;
      const older = await loadOlderEvents(slicedEvent, filters, queryKey);
      olderEvents.push(...older);
      updateViewEvent($data);
      $nowProgress = false;
    }
    viewIndex += sift; //スライドする量
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - sift, 0);
    }
  };

  function updateViewEvent(data: EventPacket[]) {
    const allEvents = [...data, ...olderEvents];
    allEvents.sort((a, b) => b.event.created_at - a.event.created_at);
    const uniqueEventsMap: { [x: string]: boolean } = {};
    const uniqueEvents = [];
    for (const event of allEvents) {
      if (!uniqueEventsMap[event.event.id]) {
        uniqueEventsMap[event.event.id] = true;
        uniqueEvents.push(event);
      }
    }
    slicedEvent = uniqueEvents
      ?.filter(
        (packet) => readUrls.includes(packet.from) && eventFilter(packet)
      ) // デフォルトリレーに含まれるかチェック
      .map(({ event }) => event)
      .slice(viewIndex, viewIndex + amount);
  }

  function handleClickTop() {
    viewIndex = 0;
  }
</script>

{#if viewIndex !== 0}
  <div class="p-1">
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

{#if $error}
  <slot name="error" error={$error} />
{:else if $data && $data?.length > 0}
  <slot events={slicedEvent} status={$status} len={$data.length} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
<div class="p-1">
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
