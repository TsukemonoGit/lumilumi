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
import type {
  UseReqOpts,
  ReqResult,
  RxReqBase,
  ReqStatus,
  UseReqOpts2,
  UseReqOpts3,
} from "$lib/types";
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
  createRxForwardReq,
} from "rx-nostr";
import { writable, derived, get } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";
import { metadata, muteCheck, scanArray } from "$lib/stores/operators";
import { set3Relays } from "./reactions";

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
  set3Relays(relays);
}

// metadataの保存
let savedMetadata: [QueryKey, EventPacket][] = [];
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

export function setSavedMetadata(data: [QueryKey, EventPacket][]) {
  // +layout.svelteがstoreのgetMetadataFromLocalStorageでsetSavedMetadata
  savedMetadata = data;
}

export function setFollowingList(data: string[]) {
  followingList = data;
  // console.log(followingList);
}
export function getFollowingList() {
  if (followingList.length > 0) {
    return followingList;
  } else {
    console.log("followingList naiyo~");
  }
}
const saveMetadataToLocalStorage = (key: QueryKey, data: EventPacket) => {
  const existingIndex = savedMetadata.findIndex(
    ([savedKey]) => JSON.stringify(savedKey) === JSON.stringify(key)
  );

  if (followingList.includes(data.event.pubkey)) {
    if (existingIndex !== -1) {
      // 既に保存されているデータがある場合、上書きする
      if (
        data.event.created_at > savedMetadata[existingIndex][1].event.created_at
      ) {
        savedMetadata[existingIndex] = [key, data];
      }
    } else {
      // 保存されていない場合、新しいデータを追加する
      savedMetadata.push([key, data]);
    }
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
    //console.log(metadata[pubkey][0]);
    //  console.log(metadata[pubkey]);
    // console.log(metadata[pubkey][0]);
    // console.log(metadata[pubkey][1]);
    get(queryClient).setQueryData(
      metadata[pubkey][0],
      (oldData: any) => metadata[pubkey][1]
    );
    // get(queryClient).setQueriesData(
    //   { queryKey: metadata[pubkey][0] },
    //   metadata[pubkey][1]
    // );
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
function generateRandomId(length: number = 6): string {
  return Array.from({ length }, () => Math.random().toString(36)[2]).join("");
}

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
    _req = createRxBackwardReq(generateRandomId());
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const obs: Observable<EventPacket | EventPacket[]> = _rxNostr
    .use(_req, { relays: relays })
    .pipe(tie, muteCheck(), metadata(), operator); //metadataのほぞんnextのとこにかいたら処理間に合わなくて全然保存されなかったからpipeにかいてみる
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

//ConnectionState
// | "initialized"
// | "connecting"
// | "connected"
// | "waiting-for-retrying"
// | "retrying"
// | "dormant"
// | "error"
// | "rejected"
// | "terminated";
// const reconectableStatus:ConnectionState[]=[];
export function relaysReconnectChallenge() {
  if (Object.entries(defaultRelays).length == 0) {
    return;
  }
  Object.entries(defaultRelays).forEach(([key, value], index) => {
    if (get(app).rxNostr.getRelayStatus(key)?.connection === "error") {
      get(app).rxNostr.reconnect(key);
    }
  });
}

export function usePromiseReq({
  queryKey,
  filters,
  operator,
  req,
  initData = [],
}: UseReqOpts<EventPacket[]>): Promise<EventPacket[]> {
  const _queryClient = get(queryClient);

  if (!_queryClient) {
    throw Error("No query client available");
  }

  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("error");
    throw Error("No default relays available");
  }

  let _req:
    | RxReqBase
    | (RxReq<"backward"> & {
        emit(
          filters: Filter | Filter[],
          options?: {
            relays: string[];
          }
        ): void;
      });

  if (req) {
    _req = req;
  } else {
    _req = createRxBackwardReq();
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();
  let accumulatedData: EventPacket[] = [...initData];

  const obs: Observable<EventPacket[]> = _rxNostr
    .use(_req)
    .pipe(tie, muteCheck(), metadata(), operator);

  return new Promise<EventPacket[]>((resolve, reject) => {
    let fulfilled = false;

    const subscription = obs.subscribe({
      next: (v: EventPacket[]) => {
        accumulatedData = [...accumulatedData, ...v];
      },

      complete: () => {
        status.set("success");
        if (!fulfilled) {
          resolve(accumulatedData);
          fulfilled = true;
        }
      },

      error: (e) => {
        console.error("[rx-nostr]", e);
        status.set("error");
        error.set(e);

        if (!fulfilled) {
          resolve(accumulatedData);
          fulfilled = true;
        }
      },
    });

    _req.emit(filters);

    // Ensure complete is called even if the observable doesn't emit data
    setTimeout(() => {
      if (!fulfilled) {
        subscription.unsubscribe();

        resolve(accumulatedData);
        fulfilled = true;
      }
    }, 3000); // Timeout after 30 seconds if not completed
  });
}
