// timelineList.ts

import { usePromiseReq } from "$lib/func/nostr";
import { scanArray } from "$lib/stores/operators";
import type { QueryKey } from "@tanstack/svelte-query";
import { createRxBackwardReq, uniq, verify, type EventPacket } from "rx-nostr";
import { pipe } from "rxjs";

export async function loadOlderEvents(
  data: string | any[],
  filters: any[],
  queryKey: QueryKey
): Promise<EventPacket[]> {
  if (data && data.length > 1) {
    const untilTimestamp = data[data.length - 1].event.created_at;
    const newFilters = filters.map((filter: any) => ({
      ...filter,
      limit: 20,
      until: untilTimestamp,
    }));
    console.log(newFilters);
    const newReq = createRxBackwardReq();
    const operator = pipe(uniq(), verify(), scanArray());
    const olderEvents = await usePromiseReq({
      operator: operator,
      queryKey: queryKey,
      filters: newFilters,
      req: newReq,
    });
    console.log(olderEvents);
    return olderEvents;
  }
  return [];
}
