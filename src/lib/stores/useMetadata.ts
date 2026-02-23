import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket, RxNostr } from "rx-nostr";

import { useReplaceableEvent } from "./useReplaceableEvent.js";
import type { ReqResult } from "$lib/types.js";

export function useMetadata(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,

  initData?: EventPacket | EventPacket[] | undefined,
  staleTime: number = Infinity,
  initialDataUpdatedAt: number | undefined = undefined,
  refetchInterval: number = Infinity,
): ReqResult<EventPacket> {
  return useReplaceableEvent(
    rxNostr,
    queryKey,
    pubkey,
    0,
    initData,
    staleTime,
    initialDataUpdatedAt,
    refetchInterval,
  );
}
