import { STORAGE_KEYS } from "#lib/func/localStorageKeys.ts";
import type { PodcastTrack } from "#lib/func/podcast.ts";

// ポッドキャスト用のグローバル再生キュー。
// 画面下部の AudioPlayerBar が唯一の <audio> 要素を所有し、
// このモジュールはその操作と状態だけを担当する。

export type PodcastLoopMode = "off" | "all" | "one";

// 音量は 0〜1 の割合で保持する。既定は最大音量
export const PODCAST_VOLUME_DEFAULT = 1;

// 15秒スキップの既定値。話題の聞き返しやCM飛ばしを想定する
export const PODCAST_SKIP_SECONDS = 15;

export interface PodcastPlayerState {
  queue: PodcastTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopMode: PodcastLoopMode;
  shuffle: boolean;
  volume: number;
  muted: boolean;
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
  volume: PODCAST_VOLUME_DEFAULT,
  muted: false,
  error: null,
});

let audioElement: HTMLAudioElement | null = null;
let pendingSeek: number | null = null;

/** プレイヤーが所有する audio 要素を登録する */
export function attachAudio(audio: HTMLAudioElement | undefined) {
  audioElement = audio ?? null;
  // 要素の差し替え時に現在の音量設定を引き継ぐ
  if (audioElement) {
    audioElement.volume = podcastPlayer.volume;
    audioElement.muted = podcastPlayer.muted;
  }
}

// 音量スライダーは操作中に何度も更新されるため、
// 保存完了のトーストを出さずに直接 localStorage へ書き込む
function persistVolume() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    STORAGE_KEYS.PODCAST_VOLUME,
    String(podcastPlayer.volume),
  );
  localStorage.setItem(STORAGE_KEYS.PODCAST_MUTED, String(podcastPlayer.muted));
}

/**
 * 保存済みの音量とミュート状態を読み込む。
 * SSR時に localStorage は無いため、クライアントのマウント後に呼ぶ。
 */
export function loadPodcastVolume() {
  if (typeof localStorage === "undefined") return;
  const savedVolume = localStorage.getItem(STORAGE_KEYS.PODCAST_VOLUME);
  if (savedVolume !== null) {
    const parsed = Number(savedVolume);
    if (Number.isFinite(parsed)) {
      podcastPlayer.volume = Math.max(0, Math.min(1, parsed));
    }
  }
  podcastPlayer.muted =
    localStorage.getItem(STORAGE_KEYS.PODCAST_MUTED) === "true";
  if (audioElement) {
    audioElement.volume = podcastPlayer.volume;
    audioElement.muted = podcastPlayer.muted;
  }
}

/** 音量を 0〜1 で設定する。0 にするとミュート状態になる */
export function setVolume(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  podcastPlayer.volume = clamped;
  podcastPlayer.muted = clamped === 0;
  if (audioElement) {
    audioElement.volume = clamped;
    audioElement.muted = podcastPlayer.muted;
  }
  persistVolume();
}

/** ミュートを切り替える */
export function toggleMute() {
  // 音量0のままミュートを解除すると無音で混乱するため、既定音量へ戻す
  if (podcastPlayer.muted && podcastPlayer.volume === 0) {
    podcastPlayer.volume = PODCAST_VOLUME_DEFAULT;
    if (audioElement) audioElement.volume = podcastPlayer.volume;
  }
  podcastPlayer.muted = !podcastPlayer.muted;
  if (audioElement) audioElement.muted = podcastPlayer.muted;
  persistVolume();
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

function loadCurrent(autoplay: boolean, seekPosition?: number) {
  const audio = audioElement;
  const track = currentTrack();
  podcastPlayer.currentTime = 0;
  podcastPlayer.duration = 0;
  podcastPlayer.error = null;
  // 前の回に指定したシーク位置を持ち越さない。
  // タイムスタンプ再生の直後に次/前の回へ移ると、その回まで同じ位置へ飛ぶのを防ぐ。
  pendingSeek = seekPosition ?? null;

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
  loadCurrent(true, startAt);
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
  // メタデータ読み込み待ちの間は、保留中のシーク位置も同じ値へ更新する。
// 更新しないと loadedmetadata 時に古い位置へ戻される。
if (pendingSeek !== null) pendingSeek = clamped;
}

/**
 * 現在位置から指定秒だけ前後に移動する。
* timeupdate の反映待ちによるズレを避けるため、状態ではなく audio.currentTime を基準にする。
* メタデータ読み込み待ちで保留中のシーク位置がある場合は、それを基準にする。
 */
export function skipBy(delta: number) {
  const audio = audioElement;
  if (!audio) return;
  const base =
    pendingSeek ??
    (Number.isFinite(audio.currentTime)
      ? audio.currentTime
      : podcastPlayer.currentTime);
  const duration = Number.isFinite(audio.duration)
    ? audio.duration
    : podcastPlayer.duration;
  const target = base delta;
  // duration が未取得（0/NaN）の場合は下限だけを守る
  const clamped =
    duration > 0
      ? Math.max(0, Math.min(target, duration))
      : Math.max(0, target);
  seekTo(clamped);
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
