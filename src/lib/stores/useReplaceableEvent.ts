import type { QueryKey } from "@tanstack/svelte-query";
import type { EventPacket, RxNostr } from "rx-nostr";
import { latest } from "rx-nostr";
import { debounceTime, pipe } from "rxjs";
import type { ReqResult } from "$lib/types.js";
import { useReq } from "$lib/func/useReq";
import { tie } from "./stores";

export function useReplaceableEvent(
  rxNostr: RxNostr,
  queryKey: QueryKey,
  pubkey: string,
  kind: number,

  initData?: EventPacket | EventPacket[] | undefined,
  staleTime: number = Infinity,
  initialDataUpdatedAt: number | undefined = undefined,
  refetchInterval: number = Infinity,
): ReqResult<EventPacket> {
  const filters = [{ kinds: [kind], authors: [pubkey], limit: 1 }];
  const operator = pipe(
    tie,
    latest(),
    debounceTime(1000), // 変化が止まるまで待つ
    //take(1) // 最初の1回だけ流す
  );

  return useReq(
    {
      queryKey,
      filters,
      operator,
      initData,
    },
    undefined,
    {
      staleTime,
      gcTime: staleTime,
      initialDataUpdatedAt,
      refetchInterval,
    },
  ) as ReqResult<EventPacket>;
}
