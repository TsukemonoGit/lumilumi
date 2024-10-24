import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";

import type { OperatorFunction } from "rxjs";

import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";

//import { useReq } from "$lib/func/useReq.js";

export function useTimelineEventList(
  queryKey: QueryKey,

  filters: Nostr.Filter[],
  operator: OperatorFunction<EventPacket, EventPacket | EventPacket[]>,
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
  // const operator = reaCheck
  //   ? pipe(pipe(), userStatus(), reactionCheck(), scanArray())
  //   : pipe(pipe(), userStatus(), scanArray());
  //フィルターに自分へのリプライを取得するフィルターが含まれているか

  return useReq({ queryKey, filters, operator, req }, relays, {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  }) as ReqResult<EventPacket[]>;
}
