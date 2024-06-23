<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { app, defaultRelays } from "$lib/stores/stores";

  //TimelineList.svelte
  import { useTimelineEventList } from "$lib/stores/useTimelineEventList";
  import type { ReqStatus, RxReqBase } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import { SkipForward, Triangle } from "lucide-svelte";
  import type Nostr from "nostr-typedef";

  import { loadOlderEvents } from "./timelineList";
  import { readable } from "svelte/store";

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
  export let req: RxReqBase | undefined = undefined;
  export let viewIndex: number;
  export let amount: number;

  $: result = useTimelineEventList(queryKey, filters, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  let slicedEvent: Nostr.Event[];
  let readUrls: string[] = [];
  $: if ($defaultRelays) {
    readUrls = Object.values($defaultRelays)
      .filter((config) => config.read)
      .map((config) => config.url);
  }
  $: if ($data && viewIndex >= 0 && filters) {
    slicedEvent = $data
      ?.filter((packet) => readUrls.includes(packet.from)) // デフォルトリレーに含まれるかチェック
      .map(({ event }) => event)
      .slice(viewIndex, viewIndex + amount);
  }

  afterNavigate(() => {
    viewIndex = 0;
    if ($data) {
      slicedEvent = $data
        ?.filter((packet) => readUrls.includes(packet.from)) // デフォルトリレーに含まれるかチェック
        .map(({ event }) => event)
        .slice(viewIndex, viewIndex + amount);
    }
  });

  // {#if viewIndex + amount < len}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus; len: number };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }

  const handleNext = async () => {
    viewIndex += 20;
    if ($data && $data.length > 1 && $data.length < viewIndex + amount) {
      const olderEvents = await loadOlderEvents($data, filters, queryKey);
      if (olderEvents) {
        // すべてのイベントを結合
        const allEvents = [...$data, ...olderEvents];

        // イベントを作成日の降順でソート
        allEvents.sort((a, b) => b.event.created_at - a.event.created_at);

        // 一意なイベントを保持するためのオブジェクト
        const uniqueEventsMap: { [x: string]: boolean } = {};

        // 一意なイベントを配列に保存
        const uniqueEvents = [];
        for (const event of allEvents) {
          if (!uniqueEventsMap[event.event.id]) {
            uniqueEventsMap[event.event.id] = true;
            uniqueEvents.push(event);
          }
        }

        // 結果を更新
        result = {
          ...result,
          data: readable(uniqueEvents),
        };
      }
    }
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - 20, 0);
    }
  };
</script>

{#if viewIndex !== 0}
  <button
    class="w-full bg-magnum-400 p-1 rounded-sm ring-1 ring-magnum-200"
    on:click={() => (viewIndex = 0)}
    ><SkipForward size={20} class="mx-auto -rotate-90" /></button
  >
  <button
    class="w-full bg-magnum-400 p-1 rounded-sm ring-1 ring-magnum-200"
    on:click={() => handlePrev()}
    ><Triangle size={20} class="mx-auto " /></button
  >
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
<button
  class="w-full bg-magnum-400 p-1 rounded-sm ring-1 ring-magnum-200"
  on:click={() => handleNext()}
  ><Triangle size={20} class="mx-auto rotate-180 " /></button
>
