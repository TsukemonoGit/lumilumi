// timelineList.ts

import { usePromiseReq } from "$lib/func/nostr";
import { scanArray } from "$lib/stores/operators";
import type { QueryKey } from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";
import { createRxBackwardReq, uniq, verify, type EventPacket } from "rx-nostr";
import { pipe } from "rxjs";
import * as Nostr from "nostr-typedef";

export async function loadOlderEvents(
  data: Nostr.Event[],
  filters: Filter[],
  queryKey: QueryKey
): Promise<EventPacket[]> {
  if (data && data.length > 1) {
    const kind1 = data.filter((item) => item.kind == 1);
    if (kind1.length === 0) {
      return [];
    }
    const lastEvent = data[data.length - 1];

    const untilTimestamp = lastEvent.created_at;
    //最後がkind1だったらほかのkind6とかは間に入ってるってことだからkind6とかも合わせて取得
    const newFilters =
      lastEvent.kind === 1
        ? filters.map((filter: Filter) => ({
            ...filter,
            limit: 20,
            until: untilTimestamp,
            since: undefined,
          }))
        : [
            {
              ...filters[0],
              limit: 20,
              until: kind1[kind1.length - 1].created_at,
              since: undefined,
            },
          ];
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
