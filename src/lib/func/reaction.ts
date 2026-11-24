import type * as Nostr from "nostr-typedef";
import { clientTag } from "./constants";

interface BuildEventOptions {
  /** 対象イベントの a タグ値（replaceable / addressable のみ） */
  atag?: string;
  /** イベントを観測したリレーのヒント */
  relayHint?: string;
  /** クライアントタグを付与するか */
  addClientTag?: boolean;
}

export interface BuildReactionOptions extends BuildEventOptions {
  /** リアクション本文。"+" がデフォルトリアクション */
  content: string;
  /**
   * 追加するタグをそのまま指定する（例: `["emoji", "name", "https://..."]`）。
   * 空配列や未指定の場合は付与しない。
   */
  emojiTag?: string[];
}

/**
 * NIP-25 のリアクションイベント（kind 7）を組み立てる。
 */
export function buildReactionEvent(
  note: Nostr.Event,
  {
    content,
    emojiTag,
    atag,
    relayHint = "",
    addClientTag = false,
  }: BuildReactionOptions,
): Nostr.EventParameters {
  const tags: string[][] = [
    ["p", note.pubkey],
    ["e", note.id, relayHint, note.pubkey],
    ["k", note.kind.toString()],
  ];

  if (atag) {
    tags.push(["a", atag, relayHint]);
  }

  if (emojiTag && emojiTag.length > 0) {
    tags.push(emojiTag);
  }

  if (addClientTag) {
    tags.push(clientTag);
  }

  return { kind: 7, tags, content };
}

export type BuildRepostOptions = BuildEventOptions;

/**
 * リポストイベントを組み立てる。
 * kind 1 は NIP-18 の kind 6、それ以外は kind 16（汎用リポスト）を使う。
 */
export function buildRepostEvent(
  note: Nostr.Event,
  { atag, relayHint = "", addClientTag = false }: BuildRepostOptions,
): Nostr.EventParameters {
  const tags: string[][] = [
    ["p", note.pubkey],
    ["e", note.id, relayHint, note.pubkey],
  ];

  if (atag) {
    tags.push(["a", atag, relayHint]);
  }

  if (note.kind !== 1) {
    tags.push(["k", note.kind.toString()]);
  }

  if (addClientTag) {
    tags.push(clientTag);
  }

  return { kind: note.kind === 1 ? 6 : 16, tags, content: "" };
}
