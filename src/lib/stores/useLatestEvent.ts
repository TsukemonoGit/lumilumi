/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 * @license This code is a derivative work based on code licensed under the Apache License, Version 2.0.
 */

import { useReq } from "$lib/func/nostr";
import type { RxReqBase, ReqResult } from "$lib/types";
import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { latest, uniq, verify } from "rx-nostr";
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
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined
): ReqResult<EventPacket> {
  const operator = pipe(latest());
  return useReq({ queryKey, filters, operator, req }) as ReqResult<EventPacket>;
}
