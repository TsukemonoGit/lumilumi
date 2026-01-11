import type { QueryKey } from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { latest, uniq } from "rx-nostr";
import { pipe } from "rxjs";
import { reduce, tap, filter } from "rxjs/operators";
import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";
import { tie } from "./stores";

export function useReplaceableEvent(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
  kind: number,
  req?:
    | (RxReq<"backward"> &
      RxReqEmittable<{
        relays: string[];
      }> &
      RxReqOverable &
      RxReqPipeable)
    | undefined,
  initData?: EventPacket | EventPacket[] | undefined,
  staleTime: number = Infinity,
  initialDataUpdatedAt: number | undefined = undefined,
  refetchInterval: number = Infinity
): ReqResult<EventPacket> {
  const filters = [{ kinds: [kind], authors: [pubkey], limit: 1 }];
  const operator = pipe(
    tie,
    uniq(), latest(),
    /* // デバッグ: kind 3（Contacts）のイベント受信のみを確認
    tap((packet: EventPacket) => {

    }),
    // reduceはObservable完了時に最終値のみを出力
    reduce((latest: EventPacket | null, current: EventPacket) => {
      // pubkeyが一致しないイベントは無視
      if (current.event.pubkey !== pubkey) return latest;

      if (!latest) return current;

      // 同じイベントIDなら更新しない
      if (latest.event.id === current.event.id) return latest;

      // created_atで比較
      return current.event.created_at > latest.event.created_at
        ? current
        : latest;
    }, null as EventPacket | null),
    // nullを除外 (イベントが来なかった場合)
    filter((packet): packet is EventPacket => packet !== null) */
  );

  return useReq(
    {
      queryKey,
      filters,
      operator,
      req,
      initData,
    },
    undefined,
    {
      staleTime,
      gcTime: staleTime,
      initialDataUpdatedAt,
      refetchInterval,
    }
  ) as ReqResult<EventPacket>;
}
