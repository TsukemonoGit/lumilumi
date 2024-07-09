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
  showImg,
  tieMapStore,
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
  completeOnTimeout,
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

export function setRelays(relays: AcceptableDefaultRelaysConfig) {
  rxNostr.setDefaultRelays(relays);
  defaultRelays.set(rxNostr.getDefaultRelays());
  set3Relays(relays);
}
export function getDefaultWriteRelays(): string[] {
  const relays = rxNostr.getDefaultRelays();
  return Object.values(relays)
    .filter((config) => config.write)
    .map((config) => config.url);
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
export function pubkeysIn(contacts: Nostr.Event): string[] {
  const followingList = contacts.tags.reduce((acc, [tag, value]) => {
    if (tag === "p") {
      return [...acc, value];
    } else {
      return acc;
    }
  }, []);
  console.log("set followList");
  setFollowingList(followingList);
  return followingList;
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
  if (get(showImg) === false) {
    //画像表示おんのときは新しいの取るから、古いのをセットしない。画像表示しないときは古いの使い回す
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
  }
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
export function generateRandomId(length: number = 6): string {
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
    .pipe(muteCheck(), metadata(), operator); //metadataのほぞんnextのとこにかいたら処理間に合わなくて全然保存されなかったからpipeにかいてみる
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
): Promise<{ event: Nostr.Event; res: OkPacketAgainstEvent[] }> {
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
  return { event: event, res: res };
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
export function reconnectRelay(url: string) {
  get(app).rxNostr.reconnect(url);
}
let tieKey: string;
export function setTieKey(key: string) {
  tieKey = key;
}
export function getRelaysById(id: string): string[] {
  const tieMap: Map<string, Set<string>> = get(tieMapStore)?.[tieKey]?.[1];
  return Array.from(tieMap?.get(id) || []);
}
export function usePromiseReq(
  {
    queryKey,
    filters,
    operator,
    req,
    initData = [],
  }: UseReqOpts<EventPacket[] | EventPacket>,
  relays: string[] | undefined
): Promise<EventPacket[]> {
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

  // 初期データが配列でない場合は、配列に変換
  let accumulatedData: EventPacket[] = Array.isArray(initData)
    ? [...initData]
    : [initData];

  const obs: Observable<EventPacket[] | EventPacket> = _rxNostr
    .use(_req, { relays: relays })
    .pipe(muteCheck(), metadata(), operator, completeOnTimeout(3000));

  return new Promise<EventPacket[]>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      resolve(accumulatedData);
    }, 5000); // Timeout after 3 seconds if not completed

    const subscription = obs.subscribe({
      next: (v: EventPacket[] | EventPacket) => {
        //   console.log(v);
        // 受け取ったデータが配列でない場合、配列に変換して追加
        if (Array.isArray(v)) {
          accumulatedData = v;
        } else {
          accumulatedData.push(v);
        }
      },
      complete: () => {
        clearTimeout(timeoutId); // Cancel the timeout
        resolve(accumulatedData);
      },
      error: (e) => {
        console.log(e);
        console.error("[rx-nostr]", e);

        clearTimeout(timeoutId); // Cancel the timeout
        resolve(accumulatedData);
      },
    });

    _req.emit(filters);
  });
}
