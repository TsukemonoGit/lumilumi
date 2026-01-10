<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";
  import { queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { createRxForwardReq } from "rx-nostr";
  import { onDestroy, onMount } from "svelte";
  import * as Nostr from "nostr-typedef";

  interface Props {
    timelineQuery: QueryKey;
    globalRelays: string[] | undefined;
    eventFilter?: (event: Nostr.Event) => boolean;
  }

  const INITIAL_SINCE_OFFSET = 10 * 60;
  const AMOUNT = 50;
  const VIEW_INDEX = 0;
  const KINDS = [1, 6, 16];

  let {
    timelineQuery,
    globalRelays,
    eventFilter = () => true,
  }: Props = $props();

  let req = $state(createRxForwardReq("global"));
  let isInitializing = false;
  let since: number | undefined = $state(undefined);
  // svelte-ignore non_reactive_update
  let resetUniq: () => void;

  const initializeSince = () => {
    since = Math.floor(Date.now() / 1000) - INITIAL_SINCE_OFFSET;
    console.log(
      "[GlobalTimeline] since initialized:",
      since,
      "current time:",
      Math.floor(Date.now() / 1000)
    );
  };

  const cleanupQueries = () => {
    // キャッシュを完全にクリア
    queryClient.removeQueries({ queryKey: timelineQuery });
    queryClient.removeQueries({ queryKey: [...timelineQuery, "olderData"] });
    console.log("[GlobalTimeline] queries cleaned up");
  };

  const initialize = async () => {
    if (isInitializing) {
      console.log("[GlobalTimeline] already initializing, skipping");
      return;
    }

    console.log("[GlobalTimeline] initializing...");
    isInitializing = true;

    // 既存の状態とキャッシュを完全にクリア
    since = undefined;
    cleanupQueries();

    // resetUniqを呼び出してイベントIDの重複チェックもリセット
    resetUniq?.();

    // 新しいリクエストオブジェクトを作成
    req = createRxForwardReq("global");

    // since値を現在時刻から計算
    initializeSince();

    isInitializing = false;
    console.log("[GlobalTimeline] initialization complete");
  };

  onMount(async () => {
    console.log("[GlobalTimeline] component mounted");
    await initialize();
  });

  afterNavigate(async (navigate) => {
    if (navigate.type === "form") {
      console.log("[GlobalTimeline] form navigation, skipping initialization");
      return;
    }

    if (isInitializing) {
      console.log(
        "[GlobalTimeline] navigation during initialization, skipping"
      );
      return;
    }

    console.log("[GlobalTimeline] navigation detected");
    await initialize();
  });

  onDestroy(() => {
    console.log("[GlobalTimeline] component destroying");
    resetUniq?.();
    since = undefined;
    cleanupQueries();
    console.log("[GlobalTimeline] component destroyed");
  });

  const hasRelays = $derived(globalRelays && globalRelays.length > 0);
  const canRender = $derived(since !== undefined && hasRelays);

  $effect(() => {
    console.log("[GlobalTimeline] state changed:", {
      since,
      hasRelays,
      canRender,
      relayCount: globalRelays?.length,
    });
  });
</script>

{#if canRender}
  <TimelineList
    bind:resetUniq
    queryKey={timelineQuery}
    filters={[{ kinds: KINDS, since }]}
    olderFilters={[{ kinds: KINDS }]}
    {req}
    viewIndex={VIEW_INDEX}
    amount={AMOUNT}
    relays={globalRelays}
    {eventFilter}
  >
    {#snippet content({ events })}
      <div
        class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
      >
        {#if events && events.length > 0}
          {#each events as event (event.id)}
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
            >
              {#snippet loading()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet error()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet content({ metadata })}
                <EventCard {metadata} note={event} />
              {/snippet}
            </Metadata>
          {/each}
        {:else}
          <div class="p-4 text-center text-gray-500">
            <p>イベントが見つかりませんでした</p>
            <p class="text-sm">
              since: {since}, リレー数: {globalRelays?.length}
            </p>
          </div>
        {/if}
      </div>
    {/snippet}
    {#snippet loading()}
      <div class="p-4 text-center">
        <p>Loading...</p>
      </div>
    {/snippet}
    {#snippet error()}
      <div class="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    {/snippet}
  </TimelineList>
{/if}
