import { expect, test } from "vitest";
import { generateNip22Reply, generateReply } from "./replyGenerator";

// テスト用イベントの共通フィクスチャ。
// sig は検証に使わないため、既存テストから流用したダミー値。
const pubkey = "96203d66276e3214ea93b6c78a577c3c9a7279f9ee7e51b22f3b8c17643a819c";
const dummySig =
  "a146ccc5880ee36844453391df84b3d212c73b41339ab7350e68e9f6880e90f0028690043e7e3888283142f9a0af60eb34091d478335cb39e196a365941a5fd1";

// kind 1 のトップレベル投稿
const kind1Note = {
  content: "Hello",
  created_at: 1700000000,
  id: "2478d792c2746af6b897e8b481aeb8f41bf95f49b132a765c70d55c77e770772",
  kind: 1,
  pubkey,
  sig: dummySig,
  tags: [],
};

// root マーカー付きの kind 1（既存スレッド内へのリプライ）
const kind1NoteWithRoot = {
  ...kind1Note,
  id: "8c2f9d1a4e6b7c3d5f8a0e97b6c4d2e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c",
  tags: [
    ["e", "6a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f80", "wss://relay.example", "root"],
    ["p", pubkey],
  ],
};

// kind 42（パブチャ NIP-28）
const kind42Note = {
  content: "パブチャの投稿",
  created_at: 1700000000,
  id: "8c2f9d1a4e6b7c3d5f8a0e97b6c4d2e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c",
  kind: 42,
  pubkey,
  sig: dummySig,
  tags: [],
};

// Addressable（長文記事 NIP-23）
const longFormNote = {
  content: "# タイトル\n本文",
  created_at: 1700000000,
  id: "8c2f9d1a4e6b7c3d5f8a0e97b6c4d2e1f3a5b7c9d0e2f4a6b8c0d2e4f6a8b0c",
  kind: 30023,
  pubkey,
  sig: dummySig,
  tags: [["d", "test-article"]],
};

// kind 1111（kind 1 を root とするコメント）
const kind1111OnKind1 = {
  content: "ありがとう！",
  created_at: 1700000000,
  id: "7c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
  kind: 1111,
  pubkey,
  sig: dummySig,
  tags: [
    ["E", kind1Note.id, "wss://relay.nostr-jp.net"],
    ["K", "1"],
    ["P", pubkey],
    ["e", kind1Note.id, "wss://relay.nostr-jp.net"],
    ["k", "1"],
    ["p", pubkey],
  ],
};

const relay = "wss://relay.example";

test("generateReply: kind 1 へのトップレベルリプライは kind 1（NIP-10）で root マーカーを付ける", () => {
  expect(generateReply({ targetEvent: kind1Note, relayHint: relay })).toEqual({
    kind: 1,
    tags: [
      ["p", pubkey],
      ["e", kind1Note.id, relay, "root"],
    ],
  });
});

test("generateReply: root 付き kind 1 へのリプライは既存の root を維持し reply マーカーを付ける", () => {
  expect(generateReply({ targetEvent: kind1NoteWithRoot, relayHint: relay })).toEqual({
    kind: 1,
    tags: [
      ["p", pubkey],
      ["e", "6a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f80", relay, "root"],
      ["e", kind1NoteWithRoot.id, relay, "reply"],
    ],
  });
});

test("generateReply: kind 42 はパブチャ方式（kind 42）を維持する", () => {
  expect(generateReply({ targetEvent: kind42Note, relayHint: relay })).toEqual({
    kind: 42,
    tags: [
      ["p", pubkey],
      ["e", kind42Note.id, relay, "root"],
    ],
  });
});

test("generateReply: Addressable イベントには NIP-22（kind 1111）を生成し A と E を併記する", () => {
  expect(generateReply({ targetEvent: longFormNote, relayHint: relay })).toEqual({
    kind: 1111,
    tags: [
      ["A", `30023:${pubkey}:test-article`, relay],
      ["E", longFormNote.id, relay],
      ["K", "30023"],
      ["P", pubkey],
      ["a", `30023:${pubkey}:test-article`, relay],
      ["e", longFormNote.id, relay],
      ["k", "30023"],
      ["p", pubkey],
    ],
  });
});

test("generateReply: kind 1111 へのリプライは root 系タグを維持し parent だけ更新する", () => {
  expect(
    generateReply({ targetEvent: kind1111OnKind1, relayHint: relay }),
  ).toEqual({
    kind: 1111,
    tags: [
      ["E", kind1Note.id, "wss://relay.nostr-jp.net"],
      ["K", "1"],
      ["P", pubkey],
      ["e", kind1111OnKind1.id, relay],
      ["k", "1111"],
      ["p", pubkey],
    ],
  });
});

test("generateReply: kind 1/42 以外の汎用イベントにも NIP-22 を生成する", () => {
  expect(generateReply({ targetEvent: { ...kind1Note, kind: 5 } }).kind).toBe(1111);
});

test("generateNip22Reply: relayHint 未指定時は空文字のリレーヒントで生成する", () => {
  const result = generateNip22Reply({ targetEvent: kind1Note });
  expect(result.kind).toBe(1111);
  expect(result.tags[0]).toEqual(["E", kind1Note.id, ""]);
  expect(result.tags[3]).toEqual(["e", kind1Note.id, ""]);
});