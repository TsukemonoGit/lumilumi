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

import type { RxReqBase, ReqResult } from "$lib/types.js";
import { useReplaceableEvent } from "./useReplaceableEvent";

export function useContacts(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
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
  return useReplaceableEvent(rxNostr, queryKey, pubkey, 3, req);
}
