import type * as Nostr from "nostr-typedef";
import { isAddressableKind, isReplaceableKind } from "nostr-tools/kinds";

/**
 * Replaceable / Addressable イベントの a タグ値（`kind:pubkey:d`）を組み立てる。
 * それ以外の kind はアドレスを持たないため undefined を返す。
 */
export function getATag(note: Nostr.Event): string | undefined {
  if (!isReplaceableKind(note.kind) && !isAddressableKind(note.kind)) {
    return undefined;
  }

  const identifier = note.tags.find((tag) => tag[0] === "d")?.[1] ?? "";
  return `${note.kind}:${note.pubkey}:${identifier}`;
}
