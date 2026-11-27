import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { STORAGE_KEYS } from "#lib/func/localStorageKeys.ts";
import type { PodcastTrack } from "#lib/func/podcast.ts";

import {
  attachAudio,
  clearQueue,
  handleAudioLoadedMetadata,
  loadPodcastVolume,
  nextTrack,
  playQueue,
  PODCAST_SKIP_SECONDS,
  PODCAST_VOLUME_DEFAULT,
  podcastPlayer,
  prevTrack,
  setVolume,
  skipBy,
  toggleMute,
} from "./mediaPlayer.svelte.ts";

// 再生位置の保留（pendingSeek）が別の回へ持ち越されないことを確認する。

function makeTrack(id: string): PodcastTrack {
  return {
    eventId: id,
    url: `https://example.com/${id}.mp3`,
    title: id,
    showTitle: undefined,
    showImage: undefined,
    showPubkey: "a".repeat(64),
    website: undefined,
  };
}

function createAudioStub() {
  return {
    src: "",
    currentTime: 0,
    duration: Number.NaN,
    paused: true,
    volume: 1,
    muted: false,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    removeAttribute: vi.fn(),
    load: vi.fn(),
  };
}

function createStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

let audio: ReturnType<typeof createAudioStub>;
let storage: ReturnType<typeof createStorageStub>;

beforeEach(() => {
  storage = createStorageStub();
  vi.stubGlobal("localStorage", storage);
  audio = createAudioStub();
  podcastPlayer.loopMode = "off";
  podcastPlayer.shuffle = false;
  podcastPlayer.volume = PODCAST_VOLUME_DEFAULT;
  podcastPlayer.muted = false;
  attachAudio(audio as unknown as HTMLAudioElement);
  clearQueue();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("playQueue のシーク位置", () => {
  test("開始位置を指定するとメタデータ読み込み後にシークする", () => {
    playQueue([makeTrack("a")], 0, 120);
    handleAudioLoadedMetadata(300);

    expect(audio.currentTime).toBe(120);
    expect(podcastPlayer.currentTime).toBe(120);
  });

  test("開始位置を指定しない場合は先頭から再生する", () => {
    playQueue([makeTrack("a")], 0);
    handleAudioLoadedMetadata(300);

    expect(audio.currentTime).toBe(0);
  });
});

describe("音量操作", () => {
  test("setVolume は範囲内に丸めて audio 要素へ反映する", () => {
    setVolume(1.5);
    expect(podcastPlayer.volume).toBe(1);
    expect(audio.volume).toBe(1);

    setVolume(-0.2);
    expect(podcastPlayer.volume).toBe(0);
    expect(podcastPlayer.muted).toBe(true);
  });

  test("音量0からミュートを解除すると既定音量へ戻る", () => {
    setVolume(0);
    toggleMute();

    expect(podcastPlayer.muted).toBe(false);
    expect(podcastPlayer.volume).toBe(PODCAST_VOLUME_DEFAULT);
    expect(audio.volume).toBe(PODCAST_VOLUME_DEFAULT);
    expect(audio.muted).toBe(false);
  });
});

describe("音量設定の保存と復元", () => {
  test("setVolume は音量とミュート状態を保存する", () => {
    setVolume(0.4);

    expect(storage.getItem(STORAGE_KEYS.PODCAST_VOLUME)).toBe("0.4");
    expect(storage.getItem(STORAGE_KEYS.PODCAST_MUTED)).toBe("false");
  });

  test("toggleMute はミュート状態を保存する", () => {
    toggleMute();

    expect(storage.getItem(STORAGE_KEYS.PODCAST_MUTED)).toBe("true");
  });

  test("loadPodcastVolume は保存済みの音量とミュート状態を復元する", () => {
    storage.setItem(STORAGE_KEYS.PODCAST_VOLUME, "0.3");
    storage.setItem(STORAGE_KEYS.PODCAST_MUTED, "true");

    loadPodcastVolume();

    expect(podcastPlayer.volume).toBe(0.3);
    expect(podcastPlayer.muted).toBe(true);
    expect(audio.volume).toBe(0.3);
    expect(audio.muted).toBe(true);
  });

  test("保存された音量が範囲外なら 0〜1 に丸める", () => {
    storage.setItem(STORAGE_KEYS.PODCAST_VOLUME, "2");

    loadPodcastVolume();

    expect(podcastPlayer.volume).toBe(1);
  });
});

describe("skipBy の15秒スキップ", () => {
  test("現在位置から前後に移動する", () => {
    playQueue([makeTrack("a")]);
    handleAudioLoadedMetadata(300);
    audio.currentTime = 100;

    skipBy(PODCAST_SKIP_SECONDS);
    expect(audio.currentTime).toBe(115);
    expect(podcastPlayer.currentTime).toBe(115);

    skipBy(-PODCAST_SKIP_SECONDS);
    expect(audio.currentTime).toBe(100);
  });

  test("0未満とduration超過はクランプする", () => {
    playQueue([makeTrack("a")]);
    handleAudioLoadedMetadata(300);
    audio.currentTime = 5;

    skipBy(-PODCAST_SKIP_SECONDS);
    expect(audio.currentTime).toBe(0);

    audio.currentTime = 295;
    skipBy(PODCAST_SKIP_SECONDS);
    expect(audio.currentTime).toBe(300);
  });

  test("duration が未取得でも下限だけを守って移動する", () => {
    playQueue([makeTrack("a")]);
    audio.currentTime = 5;

    skipBy(-PODCAST_SKIP_SECONDS);
    expect(audio.currentTime).toBe(0);

    audio.currentTime = 0;
    skipBy(PODCAST_SKIP_SECONDS);
    expect(audio.currentTime).toBe(PODCAST_SKIP_SECONDS);
  });
});

describe("回を切り替えたときの保留シーク", () => {
  test("次へ進むと前の回の保留シークを破棄する", () => {
    // タイムスタンプから再生を開始し、メタデータ読み込み前に次へ移る状況
    playQueue([makeTrack("a"), makeTrack("b")], 0, 120);
    nextTrack(false);
    handleAudioLoadedMetadata(300);

    expect(audio.src).toContain("b.mp3");
    expect(audio.currentTime).toBe(0);
    expect(podcastPlayer.currentTime).toBe(0);
  });

  test("前へ戻ると前の回の保留シークを破棄する", () => {
    playQueue([makeTrack("a"), makeTrack("b")], 1, 120);
    prevTrack();
    handleAudioLoadedMetadata(300);

    expect(audio.src).toContain("a.mp3");
    expect(audio.currentTime).toBe(0);
  });
});
