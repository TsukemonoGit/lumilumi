import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { uniq } from "rx-nostr";
import { pipe } from "rxjs";

import { scanArray } from "./operators.js";
import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq.js";
import { tie } from "./stores.js";

export function useUniqueEventList(
  queryKey: QueryKey,
  filters: Nostr.Filter[],
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined
): ReqResult<EventPacket[]> {
  const operator = pipe(tie, uniq(), scanArray());
  return useReq({ queryKey, filters, operator, req }) as ReqResult<
    EventPacket[]
  >;
}
