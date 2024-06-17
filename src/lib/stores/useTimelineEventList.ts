/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type { EventPacket, RxNostr } from "rx-nostr";
import { timeline, uniq, verify } from "rx-nostr";
import { pipe } from "rxjs";

import { scanArray } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";

export function useTimelineEventList(
  queryKey: QueryKey,
  amount: number,
  filters: Nostr.Filter[],
  req?: RxReqBase | undefined
): ReqResult<EventPacket[]> {
  const operator = pipe(uniq(), verify(), scanArray(amount));
  return useReq({ queryKey, filters, operator, req }) as ReqResult<
    EventPacket[]
  >;
}