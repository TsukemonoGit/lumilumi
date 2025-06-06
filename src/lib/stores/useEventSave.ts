import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { uniq } from "rx-nostr";
import { pipe } from "rxjs";

import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";
import { tie } from "./stores";

export function useEventSave(
  queryKey: QueryKey,
  id: string,

  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined
): ReqResult<EventPacket> {
  const filters = [{ ids: [id], limit: 1 }];
  const operator = pipe(tie, uniq());
  return useReq({ queryKey, filters, operator, req }) as ReqResult<EventPacket>;
}
