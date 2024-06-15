import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket, RxNostr } from "rx-nostr";
import { uniq, verify } from "rx-nostr";
import { pipe } from "rxjs";
import * as Nostr from "nostr-typedef";
import { useReq, useReq2, useReq3 } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";
import { scanArray } from "./operators";

export function useRepReactionList(
  rxNostr: RxNostr,
  filters: Nostr.Filter[],
  req?: RxReqBase | undefined
) {
  const operator = pipe();
  return useReq3({
    rxNostr,

    filters,
    operator,
    req,
  });
}
