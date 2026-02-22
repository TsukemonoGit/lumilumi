import { bookmark, metadata } from "$lib/stores/operators";
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
import type { Writable } from "svelte/store";
import { generateRandomId } from "./nostr";
import { type Subscription, type Observable } from "rxjs";
import type { CreateQueryResult } from "@tanstack/svelte-query";

// -------------------------------------------------------
// 共通ユーティリティ
// -------------------------------------------------------

// ジェネリクス化により呼び出し元での as キャストが不要になる
function buildReqResult<T>(
  query: CreateQueryResult<T | null, Error>,
  status: Writable<ReqStatus>,
  error: Writable<Error | null>,
  initData: T | undefined,
  destroy: () => void,
): ReqResult<T> {
  return {
    data: derived(query, ($q) => $q.data, initData),
    status: derived([query, status], ([$q, $s]) => {
      if ($q.isSuccess) return "success";
      if ($q.isError) return "error";
      return $s;
    }),
    error: derived([query, error], ([$q, $e]) => {
      if ($q.isError) return $q.error;
      return $e;
    }),
    destroy,
  };
}

// -------------------------------------------------------
// useReq (backward)
// -------------------------------------------------------

// 注意: この関数を $derived 内から呼ぶと queryKey 等が変化するたびに
// createQuery が再実行される。呼び出し元では $effect + destroy() による
// cleanup を必ず実装すること。
export function useReq<T extends EventPacket | EventPacket[]>(
  {
    queryKey,
    filters,
    operator,
    req = createRxBackwardReq(),
    initData,
  }: UseReqOpts<T>,
  relays: string[] | undefined = undefined,
  { staleTime, gcTime, initialDataUpdatedAt, refetchInterval }: UseQueryOpt = {
    staleTime: 1 * 60 * 60 * 1000,
    gcTime: 1 * 60 * 60 * 1000,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  },
): ReqResult<T> {
  const _queryClient = useQueryClient();

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
  const error = writable<Error | null>(null);

  const query = createQuery({
    queryKey: queryKey,
    staleTime: staleTime,
    initialData: initData,
    initialDataUpdatedAt: initialDataUpdatedAt,
    refetchInterval: refetchInterval,
    gcTime: gcTime,
    queryFn: (): Promise<T | null> => {
      // subscription?.unsubscribe(); ← 削除

      return new Promise((resolve, reject) => {
        // 外部注入の req は over() 済みの場合があるため、
        // 呼び出し元で queryFn 再実行のたびに新規 req を渡すことが望ましい
        const _req:
          | RxReqStrategy
          | (RxReq<"backward"> &
              RxReqEmittable<{ relays: string[] }> &
              RxReqOverable &
              RxReqPipeable) = req ?? createRxBackwardReq();

        const obs: Observable<T> = _rxNostr
          .use(_req, { relays: relays })
          .pipe(metadata(), bookmark(), operator) as Observable<T>;

        let fulfilled = false;
        status.set("loading");
        error.set(null);

        obs.subscribe({
          next: (v: T) => {
            _queryClient.setQueryData(queryKey, v);
          },
          complete: () => {
            status.set("success");
            if (!fulfilled) {
              resolve(null);
            }
          },
          error: (e) => {
            console.log("error", e);
            status.set("error");
            error.set(e);
            if (!fulfilled) {
              reject(e);
              fulfilled = true;
            }
          },
        });

        _req.emit(filters);
        _req.over(); // これでcompleteが呼ばれsubscriptionが自然終了する
      });
    },
  });

  return buildReqResult<T>(query, status, error, initData, () => {
    // backward reqはover()でcompleteするため空でよい
    // 同じqueryKeyで複数インスタンスが存在する場合に
    // 他のインスタンスのsubscriptionをキャンセルしないようにする
  });
}

// -------------------------------------------------------
// useForwardReq (forward / リアルタイム)
// -------------------------------------------------------

export function useForwardReq<T extends EventPacket | EventPacket[]>(
  { queryKey, filters, operator, req, initData }: UseForwardReqOpts<T>,
  relays: string[] | undefined = undefined,
  { staleTime, gcTime, initialDataUpdatedAt, refetchInterval }: UseQueryOpt = {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  },
): ReqResult<T> {
  const _queryClient = useQueryClient();

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
  const error = writable<Error | null>(null);

  let subscription: Subscription | undefined;

  const query = createQuery({
    queryKey: queryKey,
    staleTime: staleTime,
    initialData: initData,
    initialDataUpdatedAt: initialDataUpdatedAt,
    refetchInterval: refetchInterval,
    gcTime: gcTime,
    queryFn: (): Promise<T> => {
      subscription?.unsubscribe();

      return new Promise((resolve, reject) => {
        const obs: Observable<T> = _rxNostr
          .use(req, { relays: relays })
          .pipe(metadata(), bookmark(), operator) as Observable<T>;

        let fulfilled = false;
        status.set("loading");
        error.set(null);

        subscription = obs.subscribe({
          next: (v: T) => {
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
              reject(e);
              fulfilled = true;
            }
          },
        });

        req.emit(filters);
      });
    },
  });

  return buildReqResult<T>(query, status, error, initData, () =>
    subscription?.unsubscribe(),
  );
}

// -------------------------------------------------------
// useSubscribedReq (useSearchReq / useGlobalReq を統合)
// -------------------------------------------------------

interface SubscribedReqHandle {
  unsubscribe: () => void;
}

// 注意: モジュールスコープのシングルトン。
// SSR環境では複数リクエスト間で共有されるためリクエスト混在のリスクがある。
// CSRのみの使用を前提とする。
let searchHandle: SubscribedReqHandle | undefined;
let globalHandle: SubscribedReqHandle | undefined;

export function unsubscribeSearch() {
  searchHandle?.unsubscribe();
}

export function unsubscribeGlobal() {
  globalHandle?.unsubscribe();
}

function useSubscribedReq<T extends EventPacket | EventPacket[]>(
  handleRef: { current: SubscribedReqHandle | undefined },
  { queryKey, filters, operator, req, initData }: UseForwardReqOpts<T>,
  relays: string[] | undefined = undefined,
  { staleTime, gcTime, initialDataUpdatedAt, refetchInterval }: UseQueryOpt = {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  },
): ReqResult<T> {
  // 前回のsubscriptionを破棄
  handleRef.current?.unsubscribe();

  const _queryClient = useQueryClient();

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
  const error = writable<Error | null>(null);

  let subscription: Subscription | undefined;

  // 注意: subscription は queryFn 実行後に確定する。
  // staleTime: Infinity の場合 queryFn は初回のみ実行されるため実用上問題ないが、
  // 関数呼び出し直後に unsubscribeSearch/unsubscribeGlobal を呼ぶと
  // subscription が undefined のまま unsubscribe される可能性がある。
  handleRef.current = {
    unsubscribe: () => subscription?.unsubscribe(),
  };

  const query = createQuery({
    queryKey: queryKey,
    staleTime: staleTime,
    initialData: initData,
    initialDataUpdatedAt: initialDataUpdatedAt,
    refetchInterval: refetchInterval,
    gcTime: gcTime,
    queryFn: (): Promise<T> => {
      subscription?.unsubscribe();

      return new Promise((resolve, reject) => {
        const obs: Observable<T> = _rxNostr
          .use(req, { relays: relays })
          .pipe(metadata(), bookmark(), operator) as Observable<T>;

        let fulfilled = false;
        status.set("loading");
        error.set(null);

        subscription = obs.subscribe({
          next: (v: T) => {
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
              reject(e);
              fulfilled = true;
            }
          },
        });

        req.emit(filters);
      });
    },
  });

  return buildReqResult<T>(query, status, error, initData, () =>
    subscription?.unsubscribe(),
  );
}

export function useSearchReq<T extends EventPacket | EventPacket[]>(
  opts: UseForwardReqOpts<T>,
  relays: string[] | undefined = undefined,
  queryOpt: UseQueryOpt = {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  },
): ReqResult<T> {
  const handleRef = { current: searchHandle };
  const result = useSubscribedReq<T>(handleRef, opts, relays, queryOpt);
  searchHandle = handleRef.current;
  return result;
}

export function useGlobalReq<T extends EventPacket | EventPacket[]>(
  opts: UseForwardReqOpts<T>,
  relays: string[] | undefined = undefined,
  queryOpt: UseQueryOpt = {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  },
): ReqResult<T> {
  const handleRef = { current: globalHandle };
  const result = useSubscribedReq<T>(handleRef, opts, relays, queryOpt);
  globalHandle = handleRef.current;
  return result;
}
