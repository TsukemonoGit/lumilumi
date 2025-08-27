/**
 * フィルター対応チャンク管理システム
 *
 * 複数のフィルター条件に対応したチャンク管理を行う
 * フィルター設定の変更時に効率的に再計算を行う
 */

import type { EventPacket } from "rx-nostr";
import type { QueryKey } from "@tanstack/svelte-query";
export const conversationOptions = ["all", "follow_only", "none"] as const;

export type ConversationOption = (typeof conversationOptions)[number];
// フィルター設定の型定義
export interface FilterConfig {
  conversation: ConversationOption;
  applyMute: boolean;
  // 将来的な拡張用
  [key: string]: any;
}

// フィルター結果のキャッシュ
interface FilterCache {
  config: FilterConfig;
  configHash: string;
  filteredIndices: number[]; // 元のチャンク内でのインデックス
  filteredEvents: EventPacket[];
  validEventCount: number;
}

// チャンク情報（フィルター対応版）
export interface FilteredChunkInfo {
  index: number;
  startTime: number | null;
  endTime: number | null;
  isLoaded: boolean;
  totalEventCount: number; // 元のイベント数
  filteredEventCount: number; // フィルター後のイベント数
  filterRatio: number; // フィルター通過率
}

export class FilteredChunkManager {
  private chunks: Map<number, EventPacket[]> = new Map();
  private loadedChunks: Set<number> = new Set();
  private loadingChunks: Set<number> = new Set();

  // フィルターキャッシュ（チャンクインデックス × フィルター設定）
  private filterCache: Map<string, FilterCache> = new Map();

  // 累積フィルター情報（効率的な範囲計算用）
  private cumulativeFilterInfo: Map<string, number[]> = new Map();

  private currentFilter: FilterConfig;
  private filterFunctions: Map<string, (event: EventPacket) => boolean> =
    new Map();

  constructor(
    private queryKey: QueryKey,
    initialFilter: FilterConfig,
    filterFunctions: {
      checkConversation: (event: EventPacket, mode: string) => boolean;
      //  checkMute: (event: EventPacket) => boolean;
      excludeKind0: (event: EventPacket) => boolean;
    }
  ) {
    this.currentFilter = initialFilter;
    this.setupFilterFunctions(filterFunctions);
  }

  /**
   * フィルター関数の設定
   */
  private setupFilterFunctions(filterFunctions: any): void {
    // 複合フィルター関数を作成
    this.filterFunctions.set("composite", (event: EventPacket) => {
      // Kind0を除外
      if (!filterFunctions.excludeKind0(event)) return false;

      // 会話フィルター
      if (
        !filterFunctions.checkConversation(
          event,
          this.currentFilter.conversation
        )
      ) {
        return false;
      }
      /*  
      // ミュートフィルター
      if (this.currentFilter.applyMute && !filterFunctions.checkMute(event)) {
        return false;
      }*/

      return true;
    });
  }

  /**
   * フィルター設定のハッシュ値を生成
   */
  private getFilterHash(config: FilterConfig): string {
    return JSON.stringify(config);
  }

  /**
   * フィルター設定を更新
   */
  updateFilter(newFilter: FilterConfig): void {
    const oldHash = this.getFilterHash(this.currentFilter);
    const newHash = this.getFilterHash(newFilter);

    if (oldHash !== newHash) {
      this.currentFilter = newFilter;
      this.cumulativeFilterInfo.clear(); // 累積情報をクリア
      console.log("フィルター設定が変更されました:", newFilter);
    }
  }

  /**
   * チャンクのフィルター適用
   */
  private applyFilterToChunk(chunkIndex: number): FilterCache | null {
    const chunk = this.chunks.get(chunkIndex);
    if (!chunk) return null;

    const configHash = this.getFilterHash(this.currentFilter);
    const cacheKey = `${chunkIndex}_${configHash}`;

    // キャッシュが存在する場合はそれを返す
    const cached = this.filterCache.get(cacheKey);
    if (cached) return cached;

    // フィルター適用
    const filteredIndices: number[] = [];
    const filteredEvents: EventPacket[] = [];

    const filterFn = this.filterFunctions.get("composite");
    if (filterFn) {
      chunk.forEach((event, index) => {
        if (filterFn(event)) {
          filteredIndices.push(index);
          filteredEvents.push(event);
        }
      });
    }

    // キャッシュに保存
    const filterCache: FilterCache = {
      config: { ...this.currentFilter },
      configHash,
      filteredIndices,
      filteredEvents,
      validEventCount: filteredEvents.length,
    };

    this.filterCache.set(cacheKey, filterCache);
    return filterCache;
  }

  /**
   * 累積フィルター情報を更新
   */
  private updateCumulativeInfo(configHash: string): void {
    if (this.cumulativeFilterInfo.has(configHash)) return;

    const cumulative: number[] = [];
    let total = 0;

    // 読み込み済みチャンクの順序でソート
    const sortedChunks = Array.from(this.loadedChunks).sort((a, b) => a - b);

    for (const chunkIndex of sortedChunks) {
      const filterCache = this.applyFilterToChunk(chunkIndex);
      cumulative[chunkIndex] = total;
      total += filterCache?.validEventCount || 0;
    }

    this.cumulativeFilterInfo.set(configHash, cumulative);
  }

  /**
   * フィルター適用後のインデックスから必要なチャンクを計算
   */
  getRequiredChunksForFilteredRange(
    filteredStartIndex: number,
    amount: number
  ): number[] {
    const configHash = this.getFilterHash(this.currentFilter);
    this.updateCumulativeInfo(configHash);

    const cumulative = this.cumulativeFilterInfo.get(configHash) || [];
    const requiredChunks: number[] = [];

    const currentFilteredIndex = 0;
    const targetEndIndex = filteredStartIndex + amount;

    for (const chunkIndex of Array.from(this.loadedChunks).sort(
      (a, b) => a - b
    )) {
      const chunkStart = cumulative[chunkIndex] || 0;
      const filterCache = this.applyFilterToChunk(chunkIndex);
      const chunkEnd = chunkStart + (filterCache?.validEventCount || 0);

      // 範囲と重複するチャンクを追加
      if (chunkEnd > filteredStartIndex && chunkStart < targetEndIndex) {
        requiredChunks.push(chunkIndex);
      }

      // 範囲を超えたら終了
      if (chunkStart >= targetEndIndex) break;
    }

    return requiredChunks;
  }
  // FilteredChunkManager内に追加
  hasLoadedChunks(): boolean {
    return this.loadedChunks.size > 0;
  }
  // FilteredChunkManager内に追加するメソッド
  getMaxLoadedChunkIndex(): number | null {
    if (this.loadedChunks.size === 0) {
      return null;
    }
    return Math.max(...this.loadedChunks.keys());
  }
  /**
   * フィルター適用後のイベントを取得
   */
  getFilteredEvents(filteredStartIndex: number, amount: number): EventPacket[] {
    const configHash = this.getFilterHash(this.currentFilter);
    this.updateCumulativeInfo(configHash);

    const cumulative = this.cumulativeFilterInfo.get(configHash) || [];
    const result: EventPacket[] = [];

    let collected = 0;
    const targetEndIndex = filteredStartIndex + amount;

    for (const chunkIndex of Array.from(this.loadedChunks).sort(
      (a, b) => a - b
    )) {
      const chunkStart = cumulative[chunkIndex] || 0;
      const filterCache = this.applyFilterToChunk(chunkIndex);

      if (!filterCache) continue;

      const chunkEnd = chunkStart + filterCache.validEventCount;

      // 範囲内のデータがある場合
      if (chunkEnd > filteredStartIndex && chunkStart < targetEndIndex) {
        const sliceStart = Math.max(0, filteredStartIndex - chunkStart);
        const sliceEnd = Math.min(
          filterCache.validEventCount,
          targetEndIndex - chunkStart
        );

        if (sliceStart < sliceEnd) {
          const sliced = filterCache.filteredEvents.slice(sliceStart, sliceEnd);
          result.push(...sliced);
          collected += sliced.length;
        }
      }

      // 必要な分だけ収集したら終了
      if (collected >= amount) break;
    }

    return result;
  }

  /**
   * フィルター適用後の総イベント数を取得
   */
  getFilteredEventCount(): number {
    const configHash = this.getFilterHash(this.currentFilter);
    let total = 0;

    for (const chunkIndex of this.loadedChunks) {
      const filterCache = this.applyFilterToChunk(chunkIndex);
      total += filterCache?.validEventCount || 0;
    }

    return total;
  }

  /**
   * チャンク情報を取得（フィルター対応）
   */
  getFilteredChunkInfo(chunkIndex: number): FilteredChunkInfo {
    const chunk = this.chunks.get(chunkIndex);
    const filterCache = this.applyFilterToChunk(chunkIndex);

    let startTime: number | null = null;
    let endTime: number | null = null;

    if (filterCache && filterCache.filteredEvents.length > 0) {
      startTime = filterCache.filteredEvents[0].event.created_at;
      endTime =
        filterCache.filteredEvents[filterCache.filteredEvents.length - 1].event
          .created_at;
    }

    const totalCount = chunk?.length || 0;
    const filteredCount = filterCache?.validEventCount || 0;

    return {
      index: chunkIndex,
      startTime,
      endTime,
      isLoaded: this.loadedChunks.has(chunkIndex),
      totalEventCount: totalCount,
      filteredEventCount: filteredCount,
      filterRatio: totalCount > 0 ? filteredCount / totalCount : 0,
    };
  }

  /**
   * フィルター統計情報を取得
   */
  getFilterStats(): {
    totalEvents: number;
    filteredEvents: number;
    filterRatio: number;
    cacheHitRate: number;
    activeCacheEntries: number;
  } {
    let totalEvents = 0;
    let filteredEvents = 0;
    let cacheHits = 0;

    for (const chunkIndex of this.loadedChunks) {
      const chunk = this.chunks.get(chunkIndex);
      if (chunk) {
        totalEvents += chunk.length;

        const filterCache = this.applyFilterToChunk(chunkIndex);
        if (filterCache) {
          filteredEvents += filterCache.validEventCount;
          cacheHits++;
        }
      }
    }

    return {
      totalEvents,
      filteredEvents,
      filterRatio: totalEvents > 0 ? filteredEvents / totalEvents : 0,
      cacheHitRate:
        this.loadedChunks.size > 0 ? cacheHits / this.loadedChunks.size : 0,
      activeCacheEntries: this.filterCache.size,
    };
  }

  /**
   * 古いフィルターキャッシュをクリーンアップ
   */
  cleanupFilterCache(): void {
    const currentHash = this.getFilterHash(this.currentFilter);
    const keysToRemove: string[] = [];

    for (const [key, cache] of this.filterCache) {
      if (cache.configHash !== currentHash) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => this.filterCache.delete(key));
    console.log(
      `${keysToRemove.length}個の古いフィルターキャッシュをクリーンアップしました`
    );
  }

  // 元のChunkManagerのメソッドも継承
  getChunkIndex(eventIndex: number): number {
    return Math.floor(eventIndex / 100); // CHUNK_SIZE
  }
  // FilteredChunkManager内に追加するメソッド
  getChunk(chunkIndex: number): EventPacket[] | null {
    return this.chunks.get(chunkIndex) || null;
  }
  setChunk(chunkIndex: number, data: EventPacket[]): void {
    this.chunks.set(chunkIndex, data);
    this.loadedChunks.add(chunkIndex);
    this.loadingChunks.delete(chunkIndex);

    // 新しいチャンクが追加されたら累積情報をクリア
    this.cumulativeFilterInfo.clear();
  }

  isChunkLoaded(chunkIndex: number): boolean {
    return this.loadedChunks.has(chunkIndex);
  }

  markChunkLoading(chunkIndex: number): void {
    this.loadingChunks.add(chunkIndex);
  }

  /**
   * デバッグ情報を出力
   */
  debug(): void {
    const stats = this.getFilterStats();
    console.log("=== FilteredChunkManager Debug Info ===");
    console.log(`Current filter:`, this.currentFilter);
    console.log(`Total events: ${stats.totalEvents}`);
    console.log(`Filtered events: ${stats.filteredEvents}`);
    console.log(`Filter ratio: ${(stats.filterRatio * 100).toFixed(1)}%`);
    console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Active cache entries: ${stats.activeCacheEntries}`);

    // チャンク別の情報
    console.log("\n=== Chunk Details ===");
    for (const chunkIndex of Array.from(this.loadedChunks).sort(
      (a, b) => a - b
    )) {
      const info = this.getFilteredChunkInfo(chunkIndex);
      console.log(
        `Chunk ${chunkIndex}: ${info.filteredEventCount}/${
          info.totalEventCount
        } events (${(info.filterRatio * 100).toFixed(1)}%)`
      );
    }
  }

  /**
   * 破棄処理
   */
  destroy(): void {
    this.chunks.clear();
    this.loadedChunks.clear();
    this.loadingChunks.clear();
    this.filterCache.clear();
    this.cumulativeFilterInfo.clear();
    console.log("FilteredChunkManager destroyed");
  }
}
