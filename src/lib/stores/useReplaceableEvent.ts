/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { filterByKind, latest, verify } from "rx-nostr";
import { pipe } from "rxjs";

import { filterPubkey } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";

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
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined,
  initData?: EventPacket | EventPacket[] | undefined,
  staleTime: number = Infinity,
  initialDataUpdatedAt: number | undefined = undefined,
  refetchInterval: number = Infinity
): ReqResult<EventPacket> {
  // TODO: Add npub support
  const filters = [{ kinds: [kind], authors: [pubkey], limit: 1 }];
  const operator = pipe(latest());
  return useReq(
    {
      queryKey,
      filters,
      operator,
      req,
      initData,
    },
    undefined,
    staleTime,
    initialDataUpdatedAt,
    refetchInterval
  ) as ReqResult<EventPacket>;
}
