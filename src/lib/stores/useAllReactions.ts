import type { EventPacket } from "rx-nostr";
import type { ReqResult } from "$lib/types.js";

import { usePaginatedReq } from "$lib/func/nostr";

export function useAllReactions(
  id: string | undefined,
  atag: string | undefined,
): ReqResult<EventPacket[]> {
  const filters =
    atag !== undefined
      ? [
          { kinds: [1, 42, 6, 7, 9735, 1111], "#a": [atag] },
          { kinds: [1, 42, 6, 7, 9735, 1111], "#q": [atag] },
          // kind1111 のトップレベルコメント（root 参照）を取得する
          { kinds: [1, 42, 6, 7, 9735, 1111], "#A": [atag] },
        ]
      : id !== undefined
      ? [
          { kinds: [1, 42, 6, 7, 9735, 1111], "#e": [id] },
          { kinds: [1, 42, 6, 7, 9735, 1111], "#q": [id] },
          // kind1111 のトップレベルコメント（root 参照）を取得する
          { kinds: [1, 42, 6, 7, 9735, 1111], "#E": [id] },
        ]
      : [];

  // そのまま usePaginatedReq を返す
  return usePaginatedReq({ filters, limit: 500 }, undefined);
}
