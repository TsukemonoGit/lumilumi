//useEvent.ts

import type { QueryKey } from "@tanstack/svelte-query";
import {
  type EventPacket,
  type RxReq,
  type RxReqEmittable,
  type RxReqOverable,
  type RxReqPipeable,
} from "rx-nostr";
import { pipe } from "rxjs";

import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";
import { tie } from "./stores";

export function useEvent(
  queryKey: QueryKey,
  id: string,

  relays?: string[] | undefined,
): ReqResult<EventPacket> {
  const filters = [{ ids: [id], limit: 1 }];
  const operator = pipe(tie);
  return useReq(
    { queryKey, filters, operator },
    relays,
  ) as ReqResult<EventPacket>;
}
