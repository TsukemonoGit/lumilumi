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
import { debounceTime } from "rxjs/operators";
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
  refetchInterval: number = Infinity,
  bufferTimeMs: number = 300
): ReqResult<EventPacket> {
  const filters = [{ kinds: [kind], authors: [pubkey], limit: 1 }];

  const operator = pipe(
    tie, // リレー接続状態に応じた再実行制御
    uniq(), // 重複イベント除去(同一idは1回のみ通過)
    debounceTime(bufferTimeMs), // 最後の受信からN ms経過後に処理開始
    latest() // created_atが最新のイベントのみ出力
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
