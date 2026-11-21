import { beforeEach, describe, expect, test, vi } from "vitest";

import type { PodcastTrack } from "#lib/func/podcast.ts";

import {
  attachAudio,
  clearQueue,
  handleAudioLoadedMetadata,
  nextTrack,
  playQueue,
  podcastPlayer,
  prevTrack,
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
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    removeAttribute: vi.fn(),
    load: vi.fn(),
  };
}

let audio: ReturnType<typeof createAudioStub>;

beforeEach(() => {
  audio = createAudioStub();
  attachAudio(audio as unknown as HTMLAudioElement);
  clearQueue();
  podcastPlayer.loopMode = "off";
  podcastPlayer.shuffle = false;
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
