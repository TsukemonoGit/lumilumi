import * as Nostr from "nostr-typedef";

// リプライ生成処理の抽象レイヤー。
// - kind 1 → NIP-10（kind 1）
// - kind 42 → NIP-28（kind 42、パブチャの現行方式を維持）
// - それ以外 → NIP-22（kind 1111）
// 将来 1111 対応が普及した際は、generateReply が常に generateNip22Reply を呼ぶように
// 分岐を削除するだけで全面統一に移行できる構造を意図している。

export interface ReplyResult {
  kind: number;
  tags: string[][];
}

export interface GenerateReplyParam {
  targetEvent: Nostr.Event;
  /** イベントが観測されたリレーのヒント。親子の参照タグの第3要素に設定する。 */
  relayHint?: string;
}

/**
 * 対象イベントの種類に応じたリプライの kind とタグを生成する。
 * 将来の全面統一時にはこの分岐を削除し、常に generateNip22Reply を呼ぶ。
 */
export function generateReply(param: GenerateReplyParam): ReplyResult {
  if (param.targetEvent.kind === 1 || param.targetEvent.kind === 42) {
    return generateNip10Reply(param);
  }
  return generateNip22Reply(param);
}

/**
 * NIP-10 / NIP-28 形式のリプライを生成する。
 * kind 1 → kind 1（e タグ + root / reply マーカー）、kind 42 → kind 42 を維持する。
 */
export function generateNip10Reply(param: GenerateReplyParam): ReplyResult {
  const note = param.targetEvent;
  const relaylist = param.relayHint ?? "";
  const tags: string[][] = [];

  tags.push(["p", note?.pubkey || ""]);

  // root マーカー付きタグを探す（kind 1 の NIP-10 / kind 42 の NIP-28 双方で使う）
  const root = (note?.tags || []).find(
    (item) =>
      (item[0] === "e" || item[0] === "a") &&
      item.length > 2 &&
      item[3] === "root",
  );

  const atag = makeATag(note);
  const addTag = atag ? ["a", atag, relaylist] : ["e", note.id, relaylist];

  if (root) {
    // 既存の root は維持し、自分は parent に対するリプライとしてマーカーを付ける
    tags.push(root);
    tags.push([...addTag, "reply"]);
  } else {
    // トップレベルリプライは root マーカーを付ける
    tags.push([...addTag, "root"]);
  }

  return { kind: note.kind === 42 ? 42 : 1, tags };
}

/**
 * NIP-22 形式の kind 1111 リプライを生成する。
 * - root 側は大文字タグ（E / A / I + K + P）
 * - parent 側は小文字タグ（e / a / i + k + p）
 * - K と k は NIP-22 により必須
 * - Addressable / Replaceable イベントに対しては、アドレスタグに加えて
 *   イベント ID を指す id タグ（E / e）を併記する（NIP-22 の推奨）
 */
export function generateNip22Reply(param: GenerateReplyParam): ReplyResult {
  const note = param.targetEvent;
  const relay = param.relayHint ?? "";
  const tags: string[][] = [];

  if (note.kind === 1111) {
    // kind 1111 へのリプライ連鎖：
    // root スコープ（大文字タグ）は対象イベントのルート情報を維持し、
    // parent スコープ（小文字タグ）だけを対象イベントに更新する
    tags.push(...extractRootTags(note));
  } else {
    // トップレベルコメント：root と parent は同一の対象イベントを指す
    tags.push(...makeReferenceTags(note, relay, "root"));
  }

  tags.push(...makeReferenceTags(note, relay, "parent"));

  return { kind: 1111, tags };
}

// NOTE: イベント ID ではなく外部識別子（URL など）を指示する I / i タグは、
// NIP-22 の対象となるが、現状 lumilumi は nostr イベントへのコメントのみ扱うため未実装。
// 将来ハッシュタグや URL スコープに対応する際に拡張する。

/**
 * 対象イベントに root スコープ（大文字タグ）が含まれる場合、その情報を抽出する。
 * kind 1111 のイベントは、自身の root を表す大文字タグを持つため、
 * リプライ連鎖時にそのまま維持するために使う。
 */
function extractRootTags(event: Nostr.Event): string[][] {
  return (event.tags || []).filter((tag) =>
    ["E", "A", "I", "K", "P"].includes(tag[0]),
  );
}

/**
 * 指定スコープ（root / parent）の参照タグ一式を生成する。
 * root 側は大文字（E / A, K, P）、parent 側は小文字（e / a, k, p）。
 */
function makeReferenceTags(
  note: Nostr.Event,
  relay: string,
  scope: "root" | "parent",
): string[][] {
  const isRoot = scope === "root";
  const idTagName = isRoot ? "E" : "e";
  const addrTagName = isRoot ? "A" : "a";
  const kindTagName = isRoot ? "K" : "k";
  const authorTagName = isRoot ? "P" : "p";

  const tags: string[][] = [];
  const atag = makeATag(note);

  if (atag) {
    // Addressable / Replaceable イベント：アドレスタグとイベント ID タグを併記
    tags.push([addrTagName, atag, relay]);
    tags.push([idTagName, note.id, relay]);
  } else {
    tags.push([idTagName, note.id, relay]);
  }

  tags.push([kindTagName, note.kind.toString()]);
  tags.push([authorTagName, note.pubkey]);

  return tags;
}

/**
 * 対象イベントから naddr（a タグの値, `kind:pubkey:d`）を組み立てる。
 * Replaceable / Addressable イベント（既存の NoteActionButtons と同じ判定）が対象。
 */
function makeATag(note: Nostr.Event): string | undefined {
  if (
    note &&
    ((note.kind >= 10000 && note.kind < 20000) ||
      (note.kind >= 30000 && note.kind < 40000) ||
      note.kind === 0 ||
      note.kind === 3)
  ) {
    const dtag = (note?.tags || []).find((tag) => tag[0] === "d");
    return `${note.kind}:${note?.pubkey || ""}:${dtag ? dtag[1] : ""}`;
  }
  return undefined;
}