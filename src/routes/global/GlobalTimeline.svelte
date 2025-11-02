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

  // 初期表示時のタイムスタンプオフセット（10分前から取得）
  const INITIAL_SINCE_OFFSET = 10 * 60;
  const AMOUNT = 50;
  const VIEW_INDEX = 0;
  const KINDS = [1, 6, 16];

  let {
    timelineQuery,
    globalRelays,
    eventFilter = () => true,
  }: Props = $props();

  // グローバルタイムライン用のリクエストオブジェクト
  // ページ遷移時に再作成することでクリーンな状態を保つ
  let req = $state(createRxForwardReq("global"));

  // 初期化処理の競合を防ぐためのフラグ
  let isInitializing = false;

  // イベント取得の開始時刻（UNIXタイムスタンプ）
  let since: number | undefined = $state(undefined);

  // TimelineListから提供されるリセット関数
  // svelte-ignore non_reactive_update
  let resetUniq: () => void;

  /**
   * since値を現在時刻から10分前に初期化
   */
  const initializeSince = () => {
    since = Math.floor(Date.now() / 1000) - INITIAL_SINCE_OFFSET;
    console.log("[GlobalTimeline] since initialized:", since);
  };

  /**
   * クエリキャッシュをクリア
   */
  const cleanupQueries = () => {
    queryClient.resetQueries({ queryKey: timelineQuery });
    queryClient.resetQueries({ queryKey: [...timelineQuery, "olderData"] });
    console.log("[GlobalTimeline] queries cleaned up");
  };

  /**
   * タイムラインの初期化処理
   * - マウント時とページ遷移時に呼ばれる
   * - 既存の状態をクリアして新しいリクエストを開始
   */
  const initialize = async () => {
    if (isInitializing) {
      console.log("[GlobalTimeline] already initializing, skipping");
      return;
    }

    console.log("[GlobalTimeline] initializing...");
    isInitializing = true;

    // 既存の状態をクリア
    since = undefined;

    // 新しいリクエストオブジェクトを作成
    // 古いリクエストの状態を引き継がないようにする
    req = createRxForwardReq("global");

    initializeSince();
    isInitializing = false;
    console.log("[GlobalTimeline] initialization complete");
  };

  onMount(async () => {
    console.log("[GlobalTimeline] component mounted");
    await initialize();
  });

  afterNavigate(async (navigate) => {
    // フォーム送信によるナビゲーションは無視
    if (navigate.type === "form") {
      console.log("[GlobalTimeline] form navigation, skipping initialization");
      return;
    }

    // 初期化中の場合は重複実行を防ぐ
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

    // TimelineListのクリーンアップ関数を実行
    resetUniq?.();

    // 状態をリセット
    since = undefined;

    // クエリキャッシュをクリア
    cleanupQueries();

    console.log("[GlobalTimeline] component destroyed");
  });

  // リレーが設定されているかチェック
  let hasRelays = $derived(globalRelays && globalRelays.length > 0);

  // タイムラインを表示する条件: since値が設定され、リレーが存在する
  let canRender = $derived(since !== undefined && hasRelays);
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
            <!-- メタデータを取得して各イベントカードに渡す -->
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
            >
              <!-- メタデータ取得中、エラー、データなしの状態でも基本的なカードを表示 -->
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
              <!-- メタデータ取得成功時はメタデータ付きで表示 -->
              {#snippet content({ metadata })}
                <EventCard {metadata} note={event} />
              {/snippet}
            </Metadata>
          {/each}
        {/if}
      </div>
    {/snippet}
    {#snippet loading()}
      <div>
        <p>Loading...</p>
      </div>
    {/snippet}
    {#snippet error()}
      <div>
        <p>{error}</p>
      </div>
    {/snippet}
  </TimelineList>
{/if}
