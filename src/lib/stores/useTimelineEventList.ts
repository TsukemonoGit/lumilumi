import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqPipeable,
} from "rx-nostr";

import type { OperatorFunction } from "rxjs";

import type { ReqResult } from "$lib/types.js";
import { useForwardReq, useGlobalReq } from "$lib/func/useReq";

export function useTimelineEventList(
  queryKey: QueryKey,

  filters: Nostr.Filter[],
  operator: OperatorFunction<EventPacket, EventPacket | EventPacket[]>,
  req: RxReq<"forward"> & RxReqEmittable & RxReqPipeable,

  relays?: string[] | undefined
): ReqResult<EventPacket[]> {
  //console.log(relays);
  return relays
    ? (useGlobalReq({ queryKey, filters, operator, req }, relays, {
        staleTime: Infinity,
        gcTime: Infinity,
        initialDataUpdatedAt: undefined,
        refetchInterval: Infinity,
      }) as ReqResult<EventPacket[]>)
    : (useForwardReq({ queryKey, filters, operator, req }, relays, {
        staleTime: Infinity,
        gcTime: Infinity,
        initialDataUpdatedAt: undefined,
        refetchInterval: Infinity,
      }) as ReqResult<EventPacket[]>);
}
