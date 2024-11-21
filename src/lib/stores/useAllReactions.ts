import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { createUniq } from "rx-nostr";
import { pipe } from "rxjs";

import { scanArray } from "./operators.js";

import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq.js";

export function useAllReactions(
  queryKey: QueryKey,

  id: string | undefined,
  atag: string | undefined,
  req?:
    | RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable
): ReqResult<EventPacket[]> {
  // イベントID に基づいて重複を排除する
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const onCache = (packet: EventPacket): void => {
    //console.log(`${packet.event.id} を初めて観測しました`);
  };
  const onHit = (packet: EventPacket): void => {
    //  console.log(`${packet.event.id} はすでに観測されています`);
  };

  const filters =
    atag !== undefined
      ? [{ kinds: [1, 42, 6, 7, 9735], "#a": [atag] }]
      : id !== undefined
      ? [
          { kinds: [1, 42, 6, 7, 9735], "#e": [id] },
          { kinds: [1, 42, 6, 7, 9735], "#q": [id] },
        ]
      : [];
  console.log(filters);
  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });
  const operator = pipe(uniq, scanArray());
  return useReq({ queryKey, filters, operator, req }) as ReqResult<
    EventPacket[]
  >;
}
