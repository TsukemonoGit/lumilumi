/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { uniq, verify } from "rx-nostr";
import { pipe } from "rxjs";

import { scanArray } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";

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
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined
): ReqResult<EventPacket[]> {
  const operator = pipe(uniq(), scanArray());
  return useReq({ queryKey, filters, operator, req }) as ReqResult<
    EventPacket[]
  >;
}
