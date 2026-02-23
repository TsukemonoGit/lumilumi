import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket, RxNostr } from "rx-nostr";

import type { ReqResult } from "$lib/types.js";
import { useReplaceableEvent } from "./useReplaceableEvent";

export function useContacts(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
): ReqResult<EventPacket> {
  return useReplaceableEvent(rxNostr, queryKey, pubkey, 3);
}
