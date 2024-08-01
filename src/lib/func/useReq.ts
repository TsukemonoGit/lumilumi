import { muteCheck, metadata } from "$lib/stores/operators";
import { app } from "$lib/stores/stores";
import type { UseReqOpts, ReqResult, RxReqBase, ReqStatus } from "$lib/types";
import { useQueryClient, createQuery } from "@tanstack/svelte-query";
import {
  type EventPacket,
  type RxReq,
  type RxReqEmittable,
  type RxReqOverable,
  type RxReqPipeable,
  createRxBackwardReq,
  tie,
} from "rx-nostr";
import { get, writable, derived, type Writable } from "svelte/store";
import { generateRandomId } from "./nostr";
import { pipe, type Observable } from "rxjs";

export function useReq(
  {
    queryKey,
    filters,
    operator,
    req,
    initData,
  }: UseReqOpts<EventPacket | EventPacket[]>,
  relays: string[] | undefined = undefined
): ReqResult<EventPacket | EventPacket[]> {
  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const query = createQuery({
    queryKey: queryKey,
    queryFn: () =>
      fetchNostrEvent(
        {
          queryKey,
          filters,
          operator,
          req,
          initData,
        },
        relays,
        status,
        error
      ),
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

export async function fetchNostrEvent(
  {
    queryKey,
    filters,
    operator,
    req,
    initData,
  }: UseReqOpts<EventPacket | EventPacket[]>,
  relays: string[] | undefined = undefined,
  status: Writable<ReqStatus>,
  error: Writable<Error>
): Promise<EventPacket | EventPacket[]> {
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

  const obs: Observable<EventPacket | EventPacket[]> = _rxNostr
    .use(_req, { relays: relays })
    .pipe(metadata(), operator); //metadataのほぞんnextのとこにかいたら処理間に合わなくて全然保存されなかったからpipeにかいてみる
  //muteCheck(),
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
          reject(e);
          fulfilled = true;
        }
      },
    });
    _req.emit(filters);
  });
}
