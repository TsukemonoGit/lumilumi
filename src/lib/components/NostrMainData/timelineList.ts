// timelineList.ts

import { usePromiseReq } from "$lib/func/nostr";
import { scanArray } from "$lib/stores/operators";
import type { QueryKey } from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";
import { createRxBackwardReq, uniq, type EventPacket } from "rx-nostr";
import { pipe } from "rxjs";
//import * as Nostr from "nostr-typedef";
import { get } from "svelte/store";
import { loginUser, slicedEvent } from "$lib/stores/stores";

export async function loadOlderEvents(
  sift: number,
  filters: Filter[],
  queryKey: QueryKey,
  lastfavcheck: boolean,

  relays: string[] | undefined
): Promise<EventPacket[]> {
  //console.log(get(slicedEvent));
  if (!get(slicedEvent) || get(slicedEvent).length < 0) {
    console.log("sliced eventがないから古いイベントトルの失敗");
    return [];
  }

  const notReactionEvent = get(slicedEvent).filter(
    (item) =>
      !item.tags.find((tag) => tag[0] === "p" && tag[1] === get(loginUser))
  );
  console.log(notReactionEvent);
  // if (data && data.length > 1) {
  //   const kind1 = data.filter(
  //     (item) =>
  //       item.event.kind === 1 &&
  //       !item.event.tags.find(
  //         (tag) => tag[0] === "p" && tag[1] === get(loginUser)
  //       )
  //   ); //通知こないたいぷのkind1の最後
  // console.log(kind1.length);
  //   console.log(kind1[kind1.length - 1]);
  // if (lastfavcheck && kind1.length === 0) {
  //   return [];
  // }
  const lastEvent = get(slicedEvent)[get(slicedEvent).length - 1];
  console.log(lastEvent);
  const untilTimestamp =
    get(slicedEvent)[get(slicedEvent).length - 1].created_at;
  console.log(untilTimestamp);
  //最後がkind1だったらほかのkind6とかは間に入ってるってことだからkind6とかも合わせて取得
  const newFilters = lastfavcheck
    ? !lastEvent.tags.find((tag) => tag[0] === "p" && tag[1] === get(loginUser)) //ラストがリアクションをTLに表示するためのフィルターではない場合
      ? filters
          .filter(
            (filter: Filter) => !filter.kinds || !filter.kinds.includes(30315)
          )
          .map((filter: Filter) => ({
            ...filter,
            limit: sift,
            until: untilTimestamp,
            since: undefined,
          }))
      : filters
          .filter(
            (filter: Filter) =>
              !filter["#p"] && (!filter.kinds || !filter.kinds.includes(30315))
          )
          .map((filter: Filter) => ({
            ...filter,
            limit: sift,
            until: notReactionEvent[notReactionEvent.length - 1].created_at,
            since: undefined,
          }))
    : filters.map((filter: Filter) => ({
        ...filter,
        limit: sift,
        until: untilTimestamp,
        since: undefined,
      }));
  console.log(newFilters);
  const newReq = createRxBackwardReq();
  const operator = pipe(uniq(), scanArray());
  const olderEvents = await usePromiseReq(
    {
      operator: operator,
      queryKey: queryKey,
      filters: newFilters,
      req: newReq,
    },
    relays
  );
  //console.log(olderEvents);
  //新しいのからsift分だけもらう（飛び飛びのイベントとかで古いのが取得されてそれ採用するとあいだのイベントが抜けるから）
  return olderEvents.slice(0, sift);
}

export async function firstLoadOlderEvents(
  sift: number,
  filters: Filter[],
  queryKey: QueryKey,

  relays: string[] | undefined
): Promise<EventPacket[]> {
  const newReq = createRxBackwardReq();
  const operator = pipe(uniq(), scanArray());
  const olderEvents = await usePromiseReq(
    {
      operator: operator,
      queryKey: queryKey,
      filters: filters,
      req: newReq,
    },
    relays
  );
  //新しいのからsift分だけもらう（飛び飛びのイベントとかで古いのが取得されてそれ採用するとあいだのイベントが抜けるから）
  return olderEvents.slice(0, sift === 0 ? undefined : sift);
}
