/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket, RxNostr } from "rx-nostr";
import { uniq, verify } from "rx-nostr";
import { pipe } from "rxjs";

import { filterId } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";

export function useEvent(
  queryKey: QueryKey,
  id: string,
  req?: RxReqBase | undefined
): ReqResult<EventPacket> {
  const filters = [{ ids: [id], limit: 1 }];
  const operator = pipe(filterId(id), uniq(), verify());
  return useReq({ queryKey, filters, operator, req }) as ReqResult<EventPacket>;
}
