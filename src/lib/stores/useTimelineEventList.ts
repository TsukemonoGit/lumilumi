import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { createUniq } from "rx-nostr";
import { pipe } from "rxjs";

import { scanArray, userStatus } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { ReqResult } from "$lib/types.js";
//import { useReq } from "$lib/func/useReq.js";

export function useTimelineEventList(
  queryKey: QueryKey,

  filters: Nostr.Filter[],

  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined,

  relays?: string[] | undefined
): ReqResult<EventPacket[]> {
  // イベントID に基づいて重複を排除する
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const onCache = (packet: EventPacket): void => {
    //console.log(`${packet.event.id} を初めて観測しました`);
  };
  const onHit = (packet: EventPacket): void => {
    //  console.log(`${packet.event.id} はすでに観測されています`);
  };

  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });
  const operator = pipe(uniq, userStatus(), scanArray());
  return useReq({ queryKey, filters, operator, req }, relays) as ReqResult<
    EventPacket[]
  >;
}
