import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { uniq } from "rx-nostr";
import { pipe } from "rxjs";

import { filterId } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { ReqResult } from "$lib/types.js";

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
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined
): ReqResult<EventPacket> {
  const filters = [{ ids: [id], limit: 1 }];
  const operator = pipe();
  return useReq({ queryKey, filters, operator, req }) as ReqResult<EventPacket>;
}
