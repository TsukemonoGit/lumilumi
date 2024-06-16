import type { EventPacket, RxNostr } from "rx-nostr";
import { uniq, verify } from "rx-nostr";
import { pipe } from "rxjs";
import * as Nostr from "nostr-typedef";
import { useReq, useReq2 } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";
import { useReq3 } from "$lib/func/reactions";

export function useRepReactionList(
  rxNostr: RxNostr | undefined,
  filters: Nostr.Filter[],
  req?: RxReqBase | undefined
) {
  const operator = pipe(verify());
  return useReq3({
    rxNostr,

    filters,
    operator,
    req,
  });
}
