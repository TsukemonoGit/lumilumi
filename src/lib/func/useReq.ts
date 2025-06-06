import { metadata } from "$lib/stores/operators";
import { app } from "$lib/stores/stores";
import type {
  UseReqOpts,
  ReqResult,
  ReqStatus,
  UseQueryOpt,
  UseForwardReqOpts,
} from "$lib/types";
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
import { get, writable, derived } from "svelte/store";
import { generateRandomId } from "./nostr";
import { Subscription, type Observable } from "rxjs";

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
    staleTime: 2 * 60 * 60 * 1000, // 2 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hour
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  }
): ReqResult<EventPacket | EventPacket[]> {
  // console.log(filters);
  const _queryClient = useQueryClient(); //queryClient; //useQueryClient();
  //console.log(_queryClient);

  if (!_queryClient) {
    console.log("!_queryClient error");
    throw Error();
  }

  const _rxNostr = get(app).rxNostr;

  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("DefaultRelays error", queryKey);
    throw Error();
  }
  // console.log(_rxNostr.getDefaultRelays());

  let _req:
    | RxReqStrategy
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable);

  if (req) {
    _req = req;
  } else {
    _req = createRxBackwardReq(generateRandomId());
  }
  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

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
    queryFn: (): Promise<EventPacket | EventPacket[] | null> => {
      return new Promise((resolve, reject) => {
        let fulfilled = false;

        // let timeout: NodeJS.Timeout | null = null;

        // const clearTimeoutIfExists = () => {
        //   if (timeout !== null) {
        //     clearTimeout(timeout);
        //     timeout = null;
        //   }
        // };

        // // データが来なかった場合にタイムアウト処理を行う
        // timeout = setTimeout(() => {
        //   if (!fulfilled) {
        //     console.log(
        //       "No data received for 15 seconds. Marking as success.",
        //       queryKey
        //     );
        //     status.set("success");
        //     resolve(null); // タイムアウト時に undefined を返す
        //   }
        // }, 15000);

        obs.subscribe({
          next: (v: EventPacket | EventPacket[]) => {
            //  console.log(v);
            //  clearTimeoutIfExists();
            if (fulfilled) {
              _queryClient.setQueryData(queryKey, v);
            } else {
              resolve(v);
              fulfilled = true;
            }
          },

          complete: () => {
            //   clearTimeoutIfExists();
            //console.log("complete");
            status.set("success");

            if (!fulfilled) {
              resolve(null); // データが一度も来ていない場合は undefined を返す
            }
          },
          error: (e) => {
            //   clearTimeoutIfExists();
            console.log("error", e);
            status.set("error");
            error.set(e);

            if (!fulfilled) {
              reject(e); // エラーの場合は Promise を reject
              fulfilled = true;
            }
          },
        });
        _req.emit(filters);
        _req.over();
      });
    },
  });

  return {
    data: derived(query, ($query) => $query.data, initData),
    status: derived([query, status], ([$query, $status]) => {
      //console.log($query.data);
      if ($query.isSuccess) {
        return "success";
        // } else if ($query.isError) {
        //   return "error";
      } else {
        return $status;
      }
    }),
    error: derived([query, error], ([$query, $error]) => {
      //  if ($query.isError) {
      //       return $query.error;
      //   } else {
      return $error;
      //  }
    }),
  };
}

//メインTL以外のリアルタイムReq
export function useForwardReq(
  {
    queryKey,
    filters,
    operator,
    req,
    initData,
  }: UseForwardReqOpts<EventPacket | EventPacket[]>,
  relays: string[] | undefined = undefined,
  { staleTime, gcTime, initialDataUpdatedAt, refetchInterval }: UseQueryOpt = {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  }
): ReqResult<EventPacket | EventPacket[]> {
  const _queryClient = useQueryClient(); //queryClient; //useQueryClient();

  if (!_queryClient) {
    console.log("!_queryClient error");
    throw Error();
  }
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("DefaultRelays error", queryKey);
    throw Error();
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  //一定時間立って削除したデータの再取得できるように
  const obs: Observable<EventPacket | EventPacket[]> = _rxNostr
    .use(req, { relays: relays })
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

            if (!fulfilled) {
              console.log("fulfilled");
              reject(e);
              fulfilled = true;
            }
          },
        });
        req.emit(filters);
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

let searchSubscription: Subscription;

export function unsucscribeSearch() {
  if (searchSubscription) {
    //前回のサーチのサブスクリプションを終わらせる
    searchSubscription.unsubscribe();
  }
}
export function useSearchReq(
  {
    queryKey,
    filters,
    operator,
    req,
    initData,
  }: UseForwardReqOpts<EventPacket | EventPacket[]>,
  relays: string[] | undefined = undefined,
  { staleTime, gcTime, initialDataUpdatedAt, refetchInterval }: UseQueryOpt = {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  }
): ReqResult<EventPacket | EventPacket[]> {
  unsucscribeSearch();

  const _queryClient = useQueryClient(); //queryClient; //useQueryClient();

  if (!_queryClient) {
    console.log("!_queryClient error");
    throw Error();
  }
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("DefaultRelays error", queryKey);
    throw Error();
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  //一定時間立って削除したデータの再取得できるように
  const obs: Observable<EventPacket | EventPacket[]> = _rxNostr
    .use(req, { relays: relays })
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

        searchSubscription = obs.subscribe({
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

            if (!fulfilled) {
              console.log("fulfilled");
              reject(e);
              fulfilled = true;
            }
          },
        });
        req.emit(filters);
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

let globalSubscription: Subscription;

export function unsucscribeGlobal() {
  if (globalSubscription) {
    //前回のサーチのサブスクリプションを終わらせる
    globalSubscription.unsubscribe();
  }
}
export function useGlobalReq(
  {
    queryKey,
    filters,
    operator,
    req,
    initData,
  }: UseForwardReqOpts<EventPacket | EventPacket[]>,
  relays: string[] | undefined = undefined,
  { staleTime, gcTime, initialDataUpdatedAt, refetchInterval }: UseQueryOpt = {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  }
): ReqResult<EventPacket | EventPacket[]> {
  unsucscribeGlobal();
  const _queryClient = useQueryClient(); //queryClient; //useQueryClient();

  if (!_queryClient) {
    console.log("!_queryClient error");
    throw Error();
  }
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("DefaultRelays error", queryKey);
    throw Error();
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  //一定時間立って削除したデータの再取得できるように
  const obs: Observable<EventPacket | EventPacket[]> = _rxNostr
    .use(req, { relays: relays })
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

        globalSubscription = obs.subscribe({
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

            if (!fulfilled) {
              console.log("fulfilled");
              reject(e);
              fulfilled = true;
            }
          },
        });
        req.emit(filters);
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
