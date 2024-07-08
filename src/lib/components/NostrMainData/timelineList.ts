// timelineList.ts

import { usePromiseReq } from "$lib/func/nostr";
import { scanArray } from "$lib/stores/operators";
import type { QueryKey } from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";
import { createRxBackwardReq, uniq, verify, type EventPacket } from "rx-nostr";
import { pipe } from "rxjs";
import * as Nostr from "nostr-typedef";
import { get } from "svelte/store";
import { loginUser } from "$lib/stores/stores";

export async function loadOlderEvents(
  sift: number,
  data: Nostr.Event[],
  filters: Filter[],
  queryKey: QueryKey
): Promise<EventPacket[]> {
  if (data && data.length > 1) {
    const kind1 = data.filter(
      (item) =>
        item.kind === 1 &&
        !item.tags.find((tag) => tag[0] === "p" && tag[1] === get(loginUser))
    ); //通知こないたいぷのkind1の最後
    console.log(kind1.length);
    console.log(kind1[kind1.length - 1]);
    if (kind1.length === 0) {
      return [];
    }
    const lastEvent = data[data.length - 1];

    const untilTimestamp = data[data.length - 1].created_at;
    //最後がkind1だったらほかのkind6とかは間に入ってるってことだからkind6とかも合わせて取得
    const newFilters =
      lastEvent.kind === 1
        ? filters.map((filter: Filter) => ({
            ...filter,
            limit: sift,
            until: untilTimestamp,
            since: undefined,
          }))
        : [
            {
              ...filters[0],
              limit: sift,
              until: kind1[data.length - 1].created_at,
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
    //新しいのからsift分だけもらう（飛び飛びのイベントとかで古いのが取得されてそれ採用するとあいだのイベントが抜けるから）
    return olderEvents.slice(0, sift);
  }
  return [];
}
