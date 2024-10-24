import { metadata } from "$lib/stores/operators";
import { app } from "$lib/stores/stores";
import type { UseReqOpts, ReqResult, ReqStatus, UseQueryOpt } from "$lib/types";
import { useQueryClient, createQuery } from "@tanstack/svelte-query";
import {
  type EventPacket,
  type RxReq,
  type RxReqEmittable,
  type RxReqOverable,
  type RxReqPipeable,
  type RxReqStrategy,
  createRxBackwardReq,
} from "rx-nostr";
import { get, writable, derived, type Writable } from "svelte/store";
import { generateRandomId } from "./nostr";
import { type Observable } from "rxjs";

// RxReqのフォワードリクエストかどうかを判別する型ガード関数
function isForwardReq(req: any) {
  return req?.over === undefined;
}

export function useReq(
  {
    queryKey,
    filters,
    operator,
    req,
    initData,
  }: UseReqOpts<EventPacket | EventPacket[]>,
  relays: string[] | undefined = undefined,
  { staleTime, gcTime, initialDataUpdatedAt, refetchInterval }: UseQueryOpt = {
    staleTime: 3 * 60 * 60 * 1000,
    gcTime: 3 * 60 * 60 * 1000,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  }
): ReqResult<EventPacket | EventPacket[]> {
  const _queryClient = useQueryClient(); //get(queryClient); //useQueryClient();

  if (!_queryClient) {
    throw Error();
  }
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("error");
    throw Error();
  }
  // console.log(_rxNostr.getDefaultRelays());

  //  console.log(filters);
  let _req:
    | RxReqStrategy
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable);

  if (req) {
    _req = req;
  } else {
    _req = createRxBackwardReq(generateRandomId());
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();
  //const tie = get(tieMapStore)?.[tieKey]?.[0];
  // const obs: Observable<EventPacket | EventPacket[]> = tie
  //   ? _rxNostr.use(_req, { relays: relays }).pipe(tie, metadata(), operator) //muteCheck(),
  //   : _rxNostr.use(_req, { relays: relays }).pipe(metadata(), operator); //metadataのほぞんnextのとこにかいたら処理間に合わなくて全然保存されなかったからpipeにかいてみる//muteCheck(),

  //一定時間立って削除したデータの再取得できるように
  const obs: Observable<EventPacket | EventPacket[]> = _rxNostr
    .use(_req, { relays: relays })
    .pipe(metadata(), operator);

  const query = createQuery({
    queryKey: queryKey,
    staleTime: staleTime,
    initialData: initData,
    initialDataUpdatedAt: initialDataUpdatedAt,
    refetchInterval: refetchInterval,
    gcTime: gcTime, //未使用/非アクティブのキャッシュ・データがメモリに残る時間
    queryFn: (): Promise<EventPacket | EventPacket[]> => {
      return new Promise((resolve, reject) => {
        let fulfilled = false;

        obs.subscribe({
          next: (v: EventPacket | EventPacket[]) => {
            //console.log(v);
            if (fulfilled) {
              _queryClient.setQueryData(queryKey, v);
            } else {
              resolve(v);
              fulfilled = true;
            }
          },

          complete: () => status.set("success"),
          error: (e) => {
            console.error("[rx-nostr]", e);
            status.set("error");
            error.set(e);

            if (!fulfilled && !isForwardReq(_req)) {
              console.log("fulfilled");
              reject(e);
              fulfilled = true;
            }
          },
        });
        _req.emit(filters);
      });
    },
  });

  return {
    data: derived(query, ($query) => $query.data, initData),
    status: derived([query, status], ([$query, $status]) => {
      //console.log($query.data);
      if ($query.isSuccess) {
        return "success";
      } else if ($query.isError) {
        return "error";
      } else {
        return $status;
      }
    }),
    error: derived([query, error], ([$query, $error]) => {
      if ($query.isError) {
        return $query.error;
      } else {
        return $error;
      }
    }),
  };
}
