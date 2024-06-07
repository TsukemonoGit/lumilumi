/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket, RxNostr } from "rx-nostr";
import { filterByKind, filterKind, latest, verify } from "rx-nostr";
import { pipe } from "rxjs";

import { filterPubkey } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";

export function useReplaceableEvent(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
  kind: number,
  req?: RxReqBase | undefined
): ReqResult<EventPacket> {
  // TODO: Add npub support
  const filters = [{ kinds: [kind], authors: [pubkey], limit: 1 }];
  const operator = pipe(
    filterByKind(kind),
    filterPubkey(pubkey),
    verify(),
    latest()
  );
  return useReq({ queryKey, filters, operator, req }) as ReqResult<EventPacket>;
}
