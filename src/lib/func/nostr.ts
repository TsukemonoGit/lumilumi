/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 * @license This code is a derivative work based on code licensed under the Apache License, Version 2.0.
 */

import { app } from "$lib/stores/stores";
import type { UseReqOpts, ReqResult, RxReqBase, ReqStatus } from "$lib/types";
import {
  useQueryClient,
  createQuery,
  type QueryKey,
} from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";
import {
  type EventPacket,
  type RxReq,
  type RxReqOverable,
  type RxReqPipeable,
  createRxBackwardReq,
  createRxNostr,
  type DefaultRelayConfig,
  type AcceptableDefaultRelaysConfig,
  type RxNostr,
  createTie,
} from "rx-nostr";
import { writable, derived, get } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";

let rxNostr: RxNostr;
export function setRxNostr() {
  rxNostr = createRxNostr();
  app.set({ rxNostr: rxNostr });
}

const [tie, tieMap] = createTie();

export function getRelaysById(id: string): string[] {
  return Array.from(tieMap.get(id) || []);
}

export function setRelays(relays: AcceptableDefaultRelaysConfig) {
  rxNostr.setDefaultRelays(relays);
}

let savedMetadata: [QueryKey, unknown][];
let followingList: string[];
export function setSavedMetadata(data: [QueryKey, unknown][]) {
  //nostrMainで呼び出してセット
  savedMetadata = data;
}
export function setFollowingList(data: string[]) {
  followingList = data;
  //console.log(followingList);
}
// メタデータをlocalStorageに保存する関数
const saveMetadataToLocalStorage = (key: QueryKey, data: EventPacket) => {
  if (
    !savedMetadata.find(([savedKey]) => savedKey === key) &&
    !followingList.find((pubkey) => pubkey === data.event.pubkey)
  ) {
    savedMetadata.push([key, data]);
    localStorage.setItem("metadata", JSON.stringify(savedMetadata));
  }
};
//すでにそのキーの値があったらスルー
//また、フォロイーセットに含まれないpubkeyの場合もスルーする
// // unknownがnullでないもののみをフィルタリング
// const savemetadata = metadata.filter(
//   (item: [QueryKey, unknown]) => item[1] !== undefined
// );

// // 文字列に変換してローカルストレージに保存
// localStorage.setItem("metadata", JSON.stringify(savemetadata));
// savedMetadata = savemetadata;

//console.log(savemetadata);

export function useReq(
  {
    queryKey,
    filters,
    operator,
    req,
    initData,
  }: UseReqOpts<EventPacket | EventPacket[]>,
  relay: string[] | undefined = undefined
): ReqResult<EventPacket | EventPacket[]> {
  const queryClient = useQueryClient();
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("error");
    throw Error();
  }
  // console.log(_rxNostr.getDefaultRelays());
  //  console.log(filters);
  let _req:
    | RxReqBase
    | (RxReq<"backward"> & {
        emit(
          filters: Filter | Filter[],
          options?:
            | {
                relays: string[];
              }
            | undefined
        ): void;
      } & RxReqOverable &
        RxReqPipeable);

  if (req) {
    _req = req;
  } else {
    _req = createRxBackwardReq();
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const obs: Observable<EventPacket | EventPacket[]> = _rxNostr
    .use(_req, { relays: relay })
    .pipe(tie, operator);
  const query = createQuery({
    queryKey: queryKey,
    queryFn: (): Promise<EventPacket | EventPacket[]> => {
      return new Promise((resolve, reject) => {
        let fulfilled = false;

        obs.subscribe({
          next: (v: EventPacket | EventPacket[]) => {
            //console.log(v);
            if (fulfilled) {
              queryClient.setQueryData(queryKey, v);

              // metadataの場合はローカルストレージに保存
              if (queryKey[0] === "metadata" && v) {
                saveMetadataToLocalStorage(queryKey, v as EventPacket);
              }
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

export function publishEvent(ev: Nostr.EventParameters) {
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("error");
    throw Error();
  }
  _rxNostr.send(ev).subscribe((packet) => {
    console.log(
      `リレー ${packet.from} への送信が ${
        packet.ok ? "成功" : "失敗"
      } しました。`
    );
  });
}
