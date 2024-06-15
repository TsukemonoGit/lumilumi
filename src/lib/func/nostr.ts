/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 * @license This code is a derivative work based on code licensed under the Apache License, Version 2.0.
 */

import {
  app,
  defaultRelays,
  metadataQueue,
  queryClient,
} from "$lib/stores/stores";
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
  type OkPacketAgainstEvent,
  nip07Signer,
} from "rx-nostr";
import { writable, derived, get } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";
import { metadata } from "$lib/stores/operators";

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
  defaultRelays.set(rxNostr.getDefaultRelays());
}

// metadataの保存
let savedMetadata: [QueryKey, unknown][] = [];
let followingList: string[] = [];

let metadataChanged = false;
//metadataを更新したいときは、クエリーデータの削除とローカルストレージの削除両方する
metadataQueue.subscribe((queue) => {
  if (followingList.length > 0) {
    while (queue.length > 0) {
      const [key, data] = queue.shift()!;
      saveMetadataToLocalStorage(key, data);
    }
    if (metadataChanged) {
      localStorage?.setItem("metadata", JSON.stringify(savedMetadata));
      metadataChanged = false;
    }
  }
});

export function setSavedMetadata(data: [QueryKey, unknown][]) {
  // +layout.svelteがstoreのgetMetadataFromLocalStorageでsetSavedMetadata
  savedMetadata = data;
}

export function setFollowingList(data: string[]) {
  followingList = data;
  // console.log(followingList);
}

const saveMetadataToLocalStorage = (key: QueryKey, data: EventPacket) => {
  if (
    !savedMetadata.some(
      ([savedKey]) => JSON.stringify(savedKey) === JSON.stringify(key)
    ) && // まだ保存してない人
    followingList.includes(data.event.pubkey) // フォローしてる人
  ) {
    savedMetadata.push([key, data]);
    metadataChanged = true;
  }
};

export const getMetadataFromLocalStorage = (): void => {
  const metadataStr = localStorage.getItem("metadata");
  if (!metadataStr) {
    return;
  }

  const metadata = JSON.parse(metadataStr);
  setSavedMetadata(metadata);
  // console.log(metadata);
  Object.keys(metadata).forEach((pubkey) => {
    //  console.log(metadata[pubkey]);

    get(queryClient).setQueriesData(
      { queryKey: ["metadata", pubkey] },
      metadata[pubkey]
    );
  });

  // console.log(get(queryClient).getQueriesData({ queryKey: ["metadata"] }));
};
// const processMetadataQueue = () => {
//   while (get(metadataQueue).length > 0) {
//     const [key, data] = get(metadataQueue).shift()!;
//     saveMetadataToLocalStorage(key, data);
//   }
//   if (metadataChanged) {
//     localStorage?.setItem("metadata", JSON.stringify(savedMetadata));
//     metadataChanged = false;
//   }
// };

// Set an interval to process the queue periodically
//setInterval(processMetadataQueue, 1000);

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
    .pipe(tie, metadata(queryKey), operator); //metadataのほぞんnextのとこにかいたら処理間に合わなくて全然保存されなかったからpipeにかいてみる
  const query = createQuery({
    queryKey: queryKey,
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

export async function promisePublishEvent(
  ev: Nostr.EventParameters
): Promise<OkPacketAgainstEvent[]> {
  const _rxNostr = get(app).rxNostr;
  const signer = nip07Signer();
  const event = await signer.signEvent(ev);
  //署名の時間がタイムアウトカウントされないように先に署名
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("error");
    throw Error();
  }
  const res = await new Promise<OkPacketAgainstEvent[]>((resolve) => {
    let res: OkPacketAgainstEvent[] = [];
    setTimeout(() => {
      resolve(res);
    }, 2000);

    _rxNostr.send(event).subscribe({
      next: (packet) => {
        console.log(
          `リレー ${packet.from} への送信が ${
            packet.ok ? "成功" : "失敗"
          } しました。`
        );
        res.push(packet);
      },
      complete: () => {
        resolve(res);
      },
    });
  });
  return res;
}
