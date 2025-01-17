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
import { useSearchReq } from "$lib/func/useReq";

export function useSearchEventList(
  queryKey: QueryKey,

  filters: Nostr.Filter[],
  operator: OperatorFunction<EventPacket, EventPacket | EventPacket[]>,
  req: RxReq<"forward"> & RxReqEmittable & RxReqPipeable,

  relays?: string[] | undefined
): ReqResult<EventPacket[]> {
  // const operator = reaCheck
  //   ? pipe(pipe(), userStatus(), reactionCheck(), scanArray())
  //   : pipe(pipe(), userStatus(), scanArray());
  //フィルターに自分へのリプライを取得するフィルターが含まれているか

  return useSearchReq({ queryKey, filters, operator, req }, relays, {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  }) as ReqResult<EventPacket[]>;
}
