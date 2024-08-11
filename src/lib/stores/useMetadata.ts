import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";

import { useReplaceableEvent } from "./useReplaceableEvent.js";
import type { ReqResult } from "$lib/types.js";

export function useMetadata(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined,
  initData?: EventPacket | EventPacket[] | undefined,
  staleTime: number = Infinity,
  initialDataUpdatedAt: number | undefined = undefined,
  refetchInterval: number = Infinity
): ReqResult<EventPacket> {
  return useReplaceableEvent(
    rxNostr,
    queryKey,
    pubkey,
    0,
    req,
    initData,
    staleTime,
    initialDataUpdatedAt,
    refetchInterval
  );
}
