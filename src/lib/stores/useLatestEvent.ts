import { useReq } from "$lib/func/useReq";
import type { ReqResult } from "$lib/types";
import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { latest } from "rx-nostr";
import { pipe } from "rxjs";

export function useLatestEvent(
  queryKey: QueryKey,
  filters: Nostr.Filter[],
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined,
  relays?: string[]
): ReqResult<EventPacket> {
  const operator = pipe(latest());
  return useReq(
    { queryKey, filters, operator, req },
    relays
  ) as ReqResult<EventPacket>;
}
