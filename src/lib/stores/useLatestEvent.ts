import { useReq } from "$lib/func/useReq";
import type { ReqResult } from "$lib/types";
import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type { EventPacket } from "rx-nostr";
import { latest } from "rx-nostr";
import { pipe } from "rxjs";
import { tie } from "./stores";

export function useLatestEvent(
  queryKey: QueryKey,
  filters: Nostr.Filter[],

  relays?: string[] | undefined,
): ReqResult<EventPacket> {
  const operator = pipe(tie, latest());
  return useReq(
    { queryKey, filters, operator },
    relays,
  ) as ReqResult<EventPacket>;
}
