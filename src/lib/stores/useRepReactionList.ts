import { pipe } from "rxjs";
import * as Nostr from "nostr-typedef";
import type { RxReqBase } from "$lib/types.js";
import { useReq3 } from "$lib/func/reactions";

export function useRepReactionList(
  filters: Nostr.Filter[],
  req?: RxReqBase | undefined
) {
  const operator = pipe();
  return useReq3({
    filters,
    operator,
    req,
  });
}
