import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";

import type { ReqResult } from "$lib/types.js";
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
    | undefined
): ReqResult<EventPacket> {
  return useReplaceableEvent(rxNostr, queryKey, pubkey, 3, req);
}
