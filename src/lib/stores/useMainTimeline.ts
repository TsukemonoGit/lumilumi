import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type { EventPacket } from "rx-nostr";

import type { OperatorFunction } from "rxjs";

import type { ReqResult } from "$lib/types.js";

import { useMainTimelineReq } from "$lib/func/nostr";

//import { useReq } from "$lib/func/useReq.js";

export function useMainTimeline(
  queryKey: QueryKey,
  operator: OperatorFunction<EventPacket, EventPacket | EventPacket[]>,
  filters: Nostr.Filter[]
): ReqResult<EventPacket[]> {
  // const operator = reaCheck
  //   ? pipe(pipe(), userStatus(), reactionCheck(), scanArray())
  //   : pipe(pipe(), userStatus(), scanArray());
  //フィルターに自分へのリプライを取得するフィルターが含まれているか

  return useMainTimelineReq(operator, queryKey, filters) as ReqResult<
    EventPacket[]
  >;
}
