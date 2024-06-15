/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket, RxNostr } from "rx-nostr";
import { uniq, verify } from "rx-nostr";
import { pipe } from "rxjs";
import * as Nostr from "nostr-typedef";
import { useReq, useReq2 } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";

export function useReposted(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
  id: string,
  req?: RxReqBase | undefined
): ReqResult<EventPacket> {
  const filters: Nostr.Filter[] = [
    { authors: [pubkey], kinds: [6, 16], "#e": [id] },
  ];
  const operator = pipe(uniq());
  return useReq2({
    rxNostr,
    queryKey,
    filters,
    operator,
    req,
  }) as ReqResult<EventPacket>;
}
