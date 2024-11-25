import type { QueryKey } from "@tanstack/svelte-query";
import {
  latest,
  type EventPacket,
  type RxNostr,
  type RxReq,
  type RxReqEmittable,
  type RxReqOverable,
  type RxReqPipeable,
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
  const operator = pipe(latest());
  return useReq(
    { queryKey, filters, operator, req },
    relays
  ) as ReqResult<EventPacket>;
}
