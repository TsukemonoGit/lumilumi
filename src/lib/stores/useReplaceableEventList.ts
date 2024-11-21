import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { latestEach } from "rx-nostr";
import { pipe } from "rxjs";

import { scanArray } from "./operators.js";
import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq.js";

export function useReplaceableEventList(
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
    | undefined
): ReqResult<EventPacket[]> {
  // TODO: Add npub support
  const filters = [{ kinds: [kind], authors: [pubkey] }];
  const operator = pipe(
    latestEach((eventpacket) => {
      const tag = eventpacket.event.tags.find((tag) => tag[0] === "d");
      return tag ? tag[1] : null;
    }),

    scanArray()
  );
  return useReq({ queryKey, filters, operator, req }) as ReqResult<
    EventPacket[]
  >;
}
