import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { pipe } from "rxjs";

import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";

export function useEvent(
  queryKey: QueryKey,
  id: string,
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined,
  relays?: string[] | undefined
): ReqResult<EventPacket> {
  const filters = [{ ids: [id], limit: 1 }];
  const operator = pipe();
  return useReq(
    { queryKey, filters, operator, req },
    relays
  ) as ReqResult<EventPacket>;
}
