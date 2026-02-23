import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket } from "rx-nostr";
import { uniq } from "rx-nostr";
import { pipe } from "rxjs";

import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";
import { tie } from "./stores";

export function useEventSave(
  queryKey: QueryKey,
  id: string,
): ReqResult<EventPacket> {
  const filters = [{ ids: [id], limit: 1 }];
  const operator = pipe(tie, uniq());
  return useReq({ queryKey, filters, operator }) as ReqResult<EventPacket>;
}
