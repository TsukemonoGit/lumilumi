/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket } from "rx-nostr";
import { latestEach, verify } from "rx-nostr";
import { pipe } from "rxjs";

import { scanArray } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";

export function useReplaceableEventList(
  queryKey: QueryKey,
  pubkey: string,
  kind: number,
  req?: RxReqBase | undefined
): ReqResult<EventPacket[]> {
  // TODO: Add npub support
  const filters = [{ kinds: [kind], authors: [pubkey] }];
  const operator = pipe(
    latestEach((eventpacket) => {
      const tag = eventpacket.event.tags.find((tag) => tag[0] === "d");
      return tag ? tag[1] : null;
    }),
    verify(),
    scanArray()
  );
  return useReq({ queryKey, filters, operator, req }) as ReqResult<
    EventPacket[]
  >;
}
