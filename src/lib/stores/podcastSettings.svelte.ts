import { STORAGE_KEYS } from "#lib/func/localStorageKeys.ts";
import { saveLocalStorage } from "#lib/func/storage.ts";

// ポッドキャストの連続再生設定。
// 一覧の表示順とは独立して、再生キューの並び順だけを切り替える。

export type PodcastPlaybackOrder = "oldest" | "newest";

// 1話から順に聴く用途が多いため、既定は古い順とする
export const PODCAST_PLAYBACK_ORDER_DEFAULT: PodcastPlaybackOrder = "oldest";

export const podcastSettings = $state<{
  playbackOrder: PodcastPlaybackOrder;
}>({
  playbackOrder: PODCAST_PLAYBACK_ORDER_DEFAULT,
});

/**
 * 保存済みの再生順を読み込む。
 * SSR時に localStorage は無いため、クライアントのマウント後に呼ぶ。
 */
export function loadPodcastPlaybackOrder() {
  if (typeof localStorage === "undefined") return;
  const saved = localStorage.getItem(STORAGE_KEYS.PODCAST_PLAYBACK_ORDER);
  if (saved === "oldest" || saved === "newest") {
    podcastSettings.playbackOrder = saved;
  }
}

/** 再生順を切り替えて保存する */
export function togglePodcastPlaybackOrder() {
  const next = podcastSettings.playbackOrder === "oldest" ? "newest" : "oldest";
  podcastSettings.playbackOrder = next;
  saveLocalStorage(STORAGE_KEYS.PODCAST_PLAYBACK_ORDER, next);
}
