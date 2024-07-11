/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  AcceptableDefaultRelaysConfig,
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { createTie, createUniq, verify } from "rx-nostr";
import { pipe, type OperatorFunction } from "rxjs";

import { scanArray } from "./operators.js";
import { useReq } from "$lib/func/nostr.js";
import type { RxReqBase, ReqResult } from "$lib/types.js";
import type { Filter } from "nostr-typedef";
//import { useReq } from "$lib/func/useReq.js";

export function useTimelineEventList(
  queryKey: QueryKey,

  filters: Nostr.Filter[],
  tie: OperatorFunction<
    EventPacket,
    EventPacket & {
      seenOn: Set<string>;
      isNew: boolean;
    }
  >,
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined,

  relays?: string[] | undefined
): ReqResult<EventPacket[]> {
  // イベントID に基づいて重複を排除する
  const keyFn = (packet: EventPacket): string => packet.event.id;

  const onCache = (packet: EventPacket): void => {
    //console.log(`${packet.event.id} を初めて観測しました`);
  };
  const onHit = (packet: EventPacket): void => {
    //  console.log(`${packet.event.id} はすでに観測されています`);
  };

  const [uniq, eventIds] = createUniq(keyFn, { onCache, onHit });
  const operator = pipe(tie, uniq, scanArray());
  return useReq({ queryKey, filters, operator, req }, relays) as ReqResult<
    EventPacket[]
  >;
}
