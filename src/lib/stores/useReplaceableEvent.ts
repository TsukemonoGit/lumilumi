import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { latest } from "rx-nostr";
import { pipe } from "rxjs";

import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";
import { tie } from "./stores";

export function useReplaceableEvent(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
  kind: number,
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined,
  initData?: EventPacket | EventPacket[] | undefined,
  staleTime: number = Infinity,
  initialDataUpdatedAt: number | undefined = undefined,
  refetchInterval: number = Infinity
): ReqResult<EventPacket> {
  const filters = [{ kinds: [kind], authors: [pubkey], limit: 1 }];
  const operator = pipe(tie, latest());
  return useReq(
    {
      queryKey,
      filters,
      operator,
      req,
      initData,
    },
    undefined,
    { staleTime, gcTime: staleTime, initialDataUpdatedAt, refetchInterval }
  ) as ReqResult<EventPacket>;
}
