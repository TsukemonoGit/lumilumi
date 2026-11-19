import type { PodcastTrack } from "#lib/func/podcast.ts";

// ポッドキャスト用のグローバル再生キュー。
// 画面下部の AudioPlayerBar が唯一の <audio> 要素を所有し、
// このモジュールはその操作と状態だけを担当する。

export type PodcastLoopMode = "off" | "all" | "one";

export interface PodcastPlayerState {
  queue: PodcastTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopMode: PodcastLoopMode;
  shuffle: boolean;
  error: string | null;
}

export const podcastPlayer = $state<PodcastPlayerState>({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  loopMode: "off",
  shuffle: false,
  error: null,
});

let audioElement: HTMLAudioElement | null = null;
let pendingSeek: number | null = null;

/** プレイヤーが所有する audio 要素を登録する */
export function attachAudio(audio: HTMLAudioElement | undefined) {
  audioElement = audio ?? null;
}

/** 現在のトラックを返す */
export function currentTrack(): PodcastTrack | undefined {
  return podcastPlayer.queue[podcastPlayer.currentIndex];
}

function playAudio(audio: HTMLAudioElement) {
  podcastPlayer.error = null;
  audio
    .play()
    .then(() => {
      podcastPlayer.isPlaying = true;
    })
    .catch((reason: unknown) => {
      // 次の曲へ切り替えるために src を差し替えた場合、
      // 前の play() が AbortError で reject される。これは失敗ではない。
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      // 自動再生制限やURL不正。UI側でエラー表示する
      podcastPlayer.isPlaying = false;
      podcastPlayer.error = "play-failed";
    });
}

function loadCurrent(autoplay: boolean) {
  const audio = audioElement;
  const track = currentTrack();
  podcastPlayer.currentTime = 0;
  podcastPlayer.duration = 0;
  podcastPlayer.error = null;

  if (!audio || !track) {
    podcastPlayer.isPlaying = false;
    return;
  }

  audio.src = track.url;
  if (autoplay) {
    playAudio(audio);
  } else {
    podcastPlayer.isPlaying = false;
  }
}

/**
 * キューを差し替えて再生を開始する。
 * startAt を指定すると、メタデータ読み込み後にその位置へシークする。
 */
export function playQueue(
  tracks: PodcastTrack[],
  startIndex = 0,
  startAt?: number,
) {
  const playable = tracks.filter((track) => track.url !== "");
  if (playable.length === 0) return;

  podcastPlayer.queue = [...playable];
  podcastPlayer.currentIndex = Math.min(
    Math.max(startIndex, 0),
    playable.length - 1,
  );
  pendingSeek = startAt ?? null;
  loadCurrent(true);
}

/** 再生/一時停止を切り替える */
export function togglePlayback() {
  const audio = audioElement;
  if (!audio || !currentTrack()) return;
  if (audio.paused) {
    playAudio(audio);
  } else {
    audio.pause();
  }
}

export function pausePlayback() {
  audioElement?.pause();
}

export function seekTo(seconds: number) {
  const audio = audioElement;
  if (!audio) return;
  const duration = Number.isFinite(audio.duration) ? audio.duration : seconds;
  const clamped = Math.max(0, Math.min(seconds, duration));
  try {
    audio.currentTime = clamped;
  } catch {
    // メタデータ未読み込み時は loadedmetadata 後に再適用する
    pendingSeek = clamped;
  }
  podcastPlayer.currentTime = clamped;
}

function replayCurrent() {
  seekTo(0);
  const audio = audioElement;
  if (audio) playAudio(audio);
}

function randomIndex(length: number, exclude: number): number {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  // 同じ曲の連続再生を避ける（無限ループ防止のため数回で諦める）
  let attempts = 0;
  while (next === exclude && attempts < 10) {
    next = Math.floor(Math.random() * length);
    attempts++;
  }
  return next;
}

/**
 * 次のトラックへ進む。
 * auto=true は ended からの自動遷移で、loopMode の挙動が変わる。
 */
export function nextTrack(auto = true) {
  const length = podcastPlayer.queue.length;
  if (length === 0) return;

  if (auto && podcastPlayer.loopMode === "one") {
    replayCurrent();
    return;
  }

  if (podcastPlayer.shuffle) {
    podcastPlayer.currentIndex = randomIndex(length, podcastPlayer.currentIndex);
    loadCurrent(true);
    return;
  }

  const nextIndex = podcastPlayer.currentIndex + 1;
  if (nextIndex >= length) {
    if (podcastPlayer.loopMode === "all" || !auto) {
      podcastPlayer.currentIndex = 0;
      loadCurrent(true);
    } else {
      // 最後まで再生し終わったら停止状態にする
      podcastPlayer.isPlaying = false;
    }
    return;
  }

  podcastPlayer.currentIndex = nextIndex;
  loadCurrent(true);
}

/** 前のトラックへ戻る。3秒以上再生済みなら頭出しする */
export function prevTrack() {
  const length = podcastPlayer.queue.length;
  if (length === 0) return;

  if (podcastPlayer.currentTime > 3) {
    seekTo(0);
    return;
  }

  if (podcastPlayer.shuffle) {
    podcastPlayer.currentIndex = randomIndex(length, podcastPlayer.currentIndex);
    loadCurrent(true);
    return;
  }

  const prevIndex = podcastPlayer.currentIndex - 1;
  podcastPlayer.currentIndex =
    prevIndex < 0
      ? podcastPlayer.loopMode === "all"
        ? length - 1
        : 0
      : prevIndex;
  loadCurrent(true);
}

export function cycleLoopMode() {
  podcastPlayer.loopMode =
    podcastPlayer.loopMode === "off"
      ? "all"
      : podcastPlayer.loopMode === "all"
        ? "one"
        : "off";
}

export function toggleShuffle() {
  podcastPlayer.shuffle = !podcastPlayer.shuffle;
}

/** キューを空にしてプレイヤーを閉じる */
export function clearQueue() {
  const audio = audioElement;
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  podcastPlayer.queue = [];
  podcastPlayer.currentIndex = -1;
  podcastPlayer.isPlaying = false;
  podcastPlayer.currentTime = 0;
  podcastPlayer.duration = 0;
  podcastPlayer.error = null;
  pendingSeek = null;
}

// audio 要素のイベントを状態へ反映する
export function handleAudioPlay() {
  podcastPlayer.isPlaying = true;
}

export function handleAudioPause() {
  podcastPlayer.isPlaying = false;
}

export function handleAudioTimeUpdate(time: number) {
  podcastPlayer.currentTime = time;
}

export function handleAudioLoadedMetadata(duration: number) {
  podcastPlayer.duration = Number.isFinite(duration) ? duration : 0;
  if (pendingSeek !== null) {
    const seconds = pendingSeek;
    pendingSeek = null;
    seekTo(seconds);
  }
}

export function handleAudioEnded() {
  nextTrack(true);
}

export function handleAudioError() {
  podcastPlayer.isPlaying = false;
  podcastPlayer.error = "play-failed";
}
