<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { untrack, type Snippet } from "svelte";
  import { pipe } from "rxjs";
  import { writable } from "svelte/store";
  import { loadOlderEvents } from "$lib/components/renderSnippets/nostr/timelineList";
  import { tie } from "$lib/stores/stores";

  import { t } from "@konemono/svelte5-i18n";
  import { scanArray } from "$lib/stores/operators";
  import { uniq } from "rx-nostr";

  interface Props {
    relays: string[] | undefined;
    range: { since: number; until: number };
    filter: Nostr.Filter;
    children: Snippet<[Nostr.Event[]]>;
  }

  let { relays, range, filter, children }: Props = $props();

  const SIFT_SIZE = 200; // 1回で取得する件数
  const events = writable<Nostr.Event[]>([]);

  let error: string | null = $state(null);
  let isLoading = $state(false);
  let abortController: AbortController | null = null;

  // フィルターの変更を検知するための前回値保存
  let prevFilter: Nostr.Filter | null = $state(null);
  let prevRange: { since: number; until: number } | null = $state(null);

  $effect(() => {
    // フィルターまたは範囲が変更されたかチェック
    const filterChanged =
      !prevFilter || JSON.stringify(filter) !== JSON.stringify(prevFilter);
    const rangeChanged =
      !prevRange ||
      range.since !== prevRange.since ||
      range.until !== prevRange.until;

    if (filterChanged || rangeChanged) {
      // 前回の処理をキャンセル
      if (abortController) {
        abortController.abort();
      }

      // 状態を完全リセット
      events.set([]);
      error = null;
      isLoading = false;

      // 前回値を更新
      prevFilter = structuredClone(filter);
      prevRange = structuredClone(range);

      console.log("フィルター/範囲変更検知 - 完全リセット実行");

      untrack(() => {
        fetchRangeData();
      });
    }
  });
  let operator = $derived(pipe(tie, uniq(), scanArray()));
  // loadOlderEventsを使用してデータを段階的に取得
  async function fetchRangeData(): Promise<Nostr.Event[]> {
    if (isLoading) return [];

    isLoading = true;
    abortController = new AbortController();

    const allEvents: Nostr.Event[] = [];
    const seenEventIds = new Set<string>(); // 重複チェック用
    let currentUntil = range.until;
    let hasMore = true;
    let iteration = 0;

    error = null;

    console.log("fetchRangeData開始", { range, currentUntil, filter });

    try {
      while (
        hasMore &&
        currentUntil > range.since &&
        !abortController.signal.aborted
      ) {
        iteration++;
        console.log(`反復 ${iteration}:`, { currentUntil, hasMore });

        const currentFilters = [
          {
            ...filter,
            since: range.since,
            until: currentUntil,
          },
        ];

        const olderEvents = await loadOlderEvents(
          SIFT_SIZE,
          currentFilters,
          currentUntil,
          operator,
          relays,
          (data) => {
            if (abortController?.signal.aborted) return;

            // 重複を除去してから追加
            const newEvents = data
              .map((packet) => packet.event)
              .filter((event) => {
                if (seenEventIds.has(event.id)) {
                  //  console.log(`重複イベントをスキップ: ${event.id}`);
                  return false;
                }
                seenEventIds.add(event.id);
                return true;
              });

            allEvents.push(...newEvents);
            events.set(
              [...allEvents].sort((a, b) => b.created_at - a.created_at)
            );
          }
        );

        if (abortController?.signal.aborted) break;

        console.log(`取得件数: ${olderEvents.length}`);

        if (olderEvents.length === 0) {
          hasMore = false;
          console.log("データなし、終了");
        } else {
          const oldestEvent = olderEvents.reduce((oldest, packet) =>
            packet.event.created_at < oldest.event.created_at ? packet : oldest
          );

          console.log("最古のイベント:", oldestEvent.event.created_at);
          currentUntil = oldestEvent.event.created_at - 1;
          console.log("次のuntil:", currentUntil);

          if (olderEvents.length < SIFT_SIZE) {
            hasMore = false;
            console.log("件数不足、終了");
          }
        }

        // 安全装置として反復回数制限
        if (iteration > 50) {
          console.error("反復回数制限に達しました");
          hasMore = false;
        }
      }
    } catch (err) {
      if (abortController?.signal.aborted) {
        console.log("データ取得がキャンセルされました");
        return [];
      }
      console.error("fetchRangeDataエラー:", err);
      error = err instanceof Error ? err.message : "データ取得エラー";
    } finally {
      isLoading = false;
      if (abortController && !abortController.signal.aborted) {
        abortController = null;
      }
    }

    return allEvents;
  }

  // リアルタイムでeventsストアの変更を監視
  let currentEvents = $derived($events);
</script>

{#if error}
  <div>{$t("error", { error: error })}</div>
{:else if isLoading && currentEvents.length === 0}
  <div>{$t("data.loading")}</div>
{:else if currentEvents.length > 0}
  {@render children(currentEvents)}
{:else}
  <div>{$t("data.nodata")}</div>
{/if}
