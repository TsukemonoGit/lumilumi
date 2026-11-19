import { describe, expect, test } from "vitest";
import type * as Nostr from "nostr-typedef";
import {
  buildPodcastTracks,
  formatPlaybackTime,
  latestByPubkey,
  parsePodcastEpisode,
  parsePodcastShow,
  sortEpisodesDesc,
  timestampToSeconds,
} from "./podcast";

function makeEvent(
  overrides: Partial<Nostr.Event> & Pick<Nostr.Event, "pubkey" | "kind">,
): Nostr.Event {
  return {
    id: overrides.id ?? "0".repeat(64),
    pubkey: overrides.pubkey,
    kind: overrides.kind,
    created_at: overrides.created_at ?? 0,
    tags: overrides.tags ?? [],
    content: overrides.content ?? "",
    sig: overrides.sig ?? "0".repeat(128),
  };
}

describe("parsePodcastShow", () => {
  test("kind:10154 のタグを番組情報に変換する", () => {
    const event = makeEvent({
      pubkey: "a".repeat(64),
      kind: 10154,
      tags: [
        ["title", "テスト番組"],
        ["image", "https://example.com/cover.jpg"],
        ["description", "番組説明"],
        ["website", "https://example.com"],
        ["website", "https://example.com/about"],
        ["p", "b".repeat(64), "host"],
        ["p", "c".repeat(64)],
      ],
    });

    const show = parsePodcastShow(event);
    expect(show.title).toBe("テスト番組");
    expect(show.image).toBe("https://example.com/cover.jpg");
    expect(show.description).toBe("番組説明");
    expect(show.websites).toEqual([
      "https://example.com",
      "https://example.com/about",
    ]);
    expect(show.hosts).toEqual([
      { pubkey: "b".repeat(64), role: "host" },
      { pubkey: "c".repeat(64), role: undefined },
    ]);
  });
});

describe("parsePodcastEpisode", () => {
  test("audio / r / i タグを変換し、audioの重複を除く", () => {
    const event = makeEvent({
      id: "e".repeat(64),
      pubkey: "a".repeat(64),
      kind: 54,
      created_at: 123,
      content: "# ショーノート",
      tags: [
        ["title", "第1回"],
        ["audio", "https://example.com/1.mp3", "audio/mpeg"],
        ["audio", "https://example.com/1.mp3", "audio/mpeg"],
        ["audio", "https://example.com/2.mp3"],
        ["r", "https://example.com/ep1"],
        ["i", "podcast:item:guid:abc"],
      ],
    });

    const episode = parsePodcastEpisode(event);
    expect(episode.title).toBe("第1回");
    expect(episode.content).toBe("# ショーノート");
    expect(episode.audio).toEqual([
      { url: "https://example.com/1.mp3", type: "audio/mpeg" },
      { url: "https://example.com/2.mp3", type: undefined },
    ]);
    expect(episode.websites).toEqual(["https://example.com/ep1"]);
    expect(episode.externalIds).toEqual(["podcast:item:guid:abc"]);
  });

  test("audioタグが無い場合は空配列", () => {
    const event = makeEvent({
      pubkey: "a".repeat(64),
      kind: 54,
      tags: [["title", "音声なし"]],
    });
    expect(parsePodcastEpisode(event).audio).toEqual([]);
  });
});

describe("latestByPubkey / sortEpisodesDesc", () => {
  test("同じpubkeyではcreated_atが最新のイベントだけ残す", () => {
    const older = makeEvent({
      id: "1".repeat(64),
      pubkey: "a".repeat(64),
      kind: 10154,
      created_at: 1,
      tags: [["title", "old"]],
    });
    const newer = makeEvent({
      id: "2".repeat(64),
      pubkey: "a".repeat(64),
      kind: 10154,
      created_at: 2,
      tags: [["title", "new"]],
    });
    const other = makeEvent({
      id: "3".repeat(64),
      pubkey: "b".repeat(64),
      kind: 10154,
      created_at: 1,
      tags: [["title", "other"]],
    });

    const result = latestByPubkey([older, newer, other]);
    expect(result).toHaveLength(2);
    expect(result.find((event) => event.pubkey === "a".repeat(64))?.id).toBe(
      "2".repeat(64),
    );
  });

  test("エピソードを新しい順に並べる", () => {
    const events = [
      makeEvent({ id: "1".repeat(64), pubkey: "a".repeat(64), kind: 54, created_at: 1 }),
      makeEvent({ id: "3".repeat(64), pubkey: "a".repeat(64), kind: 54, created_at: 3 }),
      makeEvent({ id: "2".repeat(64), pubkey: "a".repeat(64), kind: 54, created_at: 2 }),
    ];
    expect(sortEpisodesDesc(events).map((event) => event.created_at)).toEqual([
      3, 2, 1,
    ]);
  });
});

describe("buildPodcastTracks", () => {
  test("audio付きエピソードだけトラック化し、番組情報を引き継ぐ", () => {
    const show = parsePodcastShow(
      makeEvent({
        pubkey: "a".repeat(64),
        kind: 10154,
        tags: [
          ["title", "番組"],
          ["image", "https://example.com/show.jpg"],
        ],
      }),
    );
    const withAudio = parsePodcastEpisode(
      makeEvent({
        id: "1".repeat(64),
        pubkey: "a".repeat(64),
        kind: 54,
        tags: [
          ["title", "第1回"],
          ["image", "https://example.com/ep.jpg"],
          ["audio", "https://example.com/1.mp3"],
        ],
      }),
    );
    const withoutAudio = parsePodcastEpisode(
      makeEvent({
        id: "2".repeat(64),
        pubkey: "a".repeat(64),
        kind: 54,
        tags: [["title", "音声なし"]],
      }),
    );

    const tracks = buildPodcastTracks([withAudio, withoutAudio], show);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toEqual({
      eventId: "1".repeat(64),
      url: "https://example.com/1.mp3",
      title: "第1回",
      showTitle: "番組",
      showImage: "https://example.com/ep.jpg",
      showPubkey: "a".repeat(64),
      website: undefined,
    });
  });
});

describe("formatPlaybackTime", () => {
  test.each([
    [0, "0:00"],
    [9, "0:09"],
    [65, "1:05"],
    [3723, "1:02:03"],
    [-1, "0:00"],
    [Number.NaN, "0:00"],
  ])("%s秒 -> %s", (seconds, expected) => {
    expect(formatPlaybackTime(seconds)).toBe(expected);
  });
});

describe("timestampToSeconds", () => {
  test.each([
    ["00:00", 0],
    ["00:12", 12],
    ["1:02:03", 3723],
    ["99:00", 5940],
    ['34\'57"', 2097],
    ["34'57”", 2097],
    ['1:01\'20"', 3680],
  ])("%s -> %s秒", (timestamp, expected) => {
    expect(timestampToSeconds(timestamp)).toBe(expected);
  });

  test.each(["12:60", "1:60:00", "abc", "1", "1:2:3:4", "12'", "12'60\""])(
    "不正な形式 %s は NaN",
    (timestamp) => {
      expect(Number.isNaN(timestampToSeconds(timestamp))).toBe(true);
    },
  );
});
