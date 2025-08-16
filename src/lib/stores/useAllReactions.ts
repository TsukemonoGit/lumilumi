import {
  type EventPacket,
  type RxReq,
  type RxReqEmittable,
  type RxReqOverable,
  type RxReqPipeable,
} from "rx-nostr";
import type { ReqResult } from "$lib/types.js";

import { usePaginatedReq } from "$lib/func/nostr";

export function useAllReactions(
  id: string | undefined,
  atag: string | undefined,
  req?:
    | RxReq<"backward"> &
        RxReqEmittable<{ relays: string[] }> &
        RxReqOverable &
        RxReqPipeable
): ReqResult<EventPacket[]> {
  const filters =
    atag !== undefined
      ? [
          { kinds: [1, 42, 6, 7, 9735, 1111], "#a": [atag] },
          { kinds: [1, 42, 6, 7, 9735, 1111], "#q": [atag] },
        ]
      : id !== undefined
      ? [
          { kinds: [1, 42, 6, 7, 9735, 1111], "#e": [id] },
          { kinds: [1, 42, 6, 7, 9735, 1111], "#q": [id] },
        ]
      : [];

  // そのまま usePaginatedReq を返す
  return usePaginatedReq({ filters, req, limit: 500 }, undefined);
}
