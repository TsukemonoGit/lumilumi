import {
  app,
  defaultRelays,
  followList,
  metadataQueue,
  queryClient,
  relayStateMap,
  tieMapStore,
  verifier,
} from "$lib/stores/stores";
import type {
  UseReqOpts,
  ReqResult,
  ReqStatus,
  UseQueryOpt,
  Profile,
  UsePromiseReqOpts,
} from "$lib/types";
import {
  useQueryClient,
  createQuery,
  type QueryKey,
} from "@tanstack/svelte-query";

import {
  type EventPacket,
  type RxReq,
  type RxReqOverable,
  type RxReqPipeable,
  createRxBackwardReq,
  createRxNostr,
  type AcceptableDefaultRelaysConfig,
  type RxNostr,
  type OkPacketAgainstEvent,
  nip07Signer,
  completeOnTimeout,
  type RxReqEmittable,
  type RxReqStrategy,
} from "rx-nostr";
import { writable, derived, get } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";
import { metadata } from "$lib/stores/operators";
import { rxNostr3ReccoctRelay, set3Relays } from "./reactions";
import { verifier as cryptoVerifier } from "rx-nostr-crypto";
import { nip19 } from "nostr-tools";

let rxNostr: RxNostr;
export function setRxNostr() {
  if (get(app)?.rxNostr) {
    return;
  }
  rxNostr = createRxNostr({ verifier: get(verifier) ?? cryptoVerifier });
  app.set({ rxNostr: rxNostr });

  rxNostr.createConnectionStateObservable().subscribe((packet) => {
    //  console.log(`${packet.from} の接続状況が ${packet.state} に変化しました。`);
    relayStateMap.update((value) => value.set(packet.from, packet.state));
  });
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

//metadataを更新したいときは、クエリーデータの削除とローカルストレージの削除両方する
metadataQueue.subscribe((queue) => {
  if (get(followList).size > 0) {
    // まず、現在のローカルストレージのデータを取得
    const metadataStr = localStorage.getItem("metadata");
    let currentMetadata: [QueryKey, EventPacket][] = metadataStr
      ? JSON.parse(metadataStr)
      : [];
    let metadataChanged = false;
    while (queue.length > 0) {
      const [key, data] = queue.shift()!;
      const [changed, savedMetadata] = saveMetadataToLocalStorage(
        currentMetadata,
        key,
        data
      );
      if (changed) {
        metadataChanged = true;
      }
      currentMetadata = savedMetadata;
    }
    if (metadataChanged) {
      localStorage?.setItem("metadata", JSON.stringify(currentMetadata));
      metadataChanged = false;
    }
  }
});

// export function setSavedMetadata(data: [QueryKey, EventPacket][]) {
//   // +layout.svelteがstoreのgetMetadataFromLocalStorageでsetSavedMetadata
//   savedMetadata = data;
// }
export function pubkeysIn(
  contacts: Nostr.Event,
  pubkey: string | undefined = undefined
): Map<string, string | undefined> {
  const followingMap: Map<string, string | undefined> = contacts.tags.reduce(
    (acc, [tag, value, relay, petname]) => {
      // "p" タグのチェック
      if (tag === "p" && !acc.has(value)) {
        // Map に pubkey をキー、petname を値として追加
        acc.set(value, petname || undefined);
      }
      return acc;
    },
    new Map<string, string | undefined>()
  );

  // 指定された pubkey が Map に存在しない場合、追加
  if (pubkey && !followingMap.has(pubkey)) {
    followingMap.set(pubkey, undefined);
  }

  setFollowingList(followingMap);
  return followingMap;
}
export function setFollowingList(data: Map<string, string | undefined>) {
  followList.set(data);
  // console.log(followingList);
}

const saveMetadataToLocalStorage = (
  currentMetadata: [QueryKey, EventPacket][],
  key: QueryKey,
  data: EventPacket
): [boolean, [QueryKey, EventPacket][]] => {
  let metadataChanged = false;
  const existingIndex = currentMetadata.findIndex(
    ([savedKey]) => JSON.stringify(savedKey) === JSON.stringify(key)
  );

  if (get(followList).has(data.event.pubkey)) {
    if (existingIndex !== -1) {
      // 既に保存されているデータがある場合、上書きする
      if (
        data.event.created_at >
        currentMetadata[existingIndex][1].event.created_at
      ) {
        //新しいデータだったら上書き
        currentMetadata[existingIndex] = [key, data];
        get(queryClient).setQueryData(key, (oldData: any) => data);
        metadataChanged = true;
      } else {
        //古いデータだったら保存されてる方を返す
        // 保存されているメタデータの方をクエリにセット（？）
        get(queryClient).setQueryData(
          key,
          (oldData: any) => currentMetadata[existingIndex][1]
        );
      }
    } else {
      // 保存されていない場合、新しいデータを追加する
      currentMetadata.push([key, data]);
      get(queryClient).setQueryData(key, (oldData: any) => data);
      metadataChanged = true;
    }
    // // 更新されたデータをローカルストレージに保存
    // localStorage.setItem("metadata", JSON.stringify(currentMetadata));
    return [metadataChanged, currentMetadata];
  } else {
    return [false, currentMetadata];
  }
};

export const getMetadata = (queryKey: QueryKey): EventPacket | undefined => {
  const metadataStr = localStorage.getItem("metadata");
  if (!metadataStr) {
    return;
  }

  const metadata: [QueryKey, EventPacket][] = JSON.parse(metadataStr);
  // console.log(
  //   metadata.find(
  //     ([key, _]) =>
  //       JSON.stringify(key) ===
  //       JSON.stringify([
  //         "metadata",
  //         "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5",
  //       ])
  //   )
  // );
  // queryKeyがオブジェクトや配列の場合、JSON.stringifyを使って比較
  const result = metadata.find(
    ([key, _]) => JSON.stringify(key) === JSON.stringify(queryKey)
  );

  return result ? result[1] : undefined;
};
// export const getMetadataFromLocalStorage = (): void => {
//   const metadataStr = localStorage.getItem("metadata");
//   if (!metadataStr) {
//     return;
//   }

//   const metadata = JSON.parse(metadataStr);
//   setSavedMetadata(metadata);
//   // console.log(metadata);
//   if (get(showImg) === false) {
//     //画像表示おんのときは新しいの取るから、古いのをセットしない。画像表示しないときは古いの使い回す
//     Object.keys(metadata).forEach((pubkey) => {
//       //console.log(metadata[pubkey][0]);
//       //  console.log(metadata[pubkey]);
//       // console.log(metadata[pubkey][0]);
//       // console.log(metadata[pubkey][1]);
//       get(queryClient).setQueryData(
//         metadata[pubkey][0],
//         (oldData: any) => metadata[pubkey][1],
//         { updatedAt: Infinity }
//       );
//       // get(queryClient).setQueriesData(
//       //   { queryKey: metadata[pubkey][0] },
//       //   metadata[pubkey][1]
//       // );
//     });
//   }
//   // console.log(get(queryClient).getQueriesData({ queryKey: ["metadata"] }));
//};

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

// RxReqのフォワードリクエストかどうかを判別する型ガード関数
function isForwardReq(req: any) {
  return req?.over === undefined;
}

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
export async function promisePublishSignedEvent(
  event: Nostr.Event
): Promise<{ event: Nostr.Event; res: OkPacketAgainstEvent[] }> {
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length === 0) {
    console.log("error");
    throw new Error("No default relays found.");
  }

  return new Promise<OkPacketAgainstEvent[]>((resolve) => {
    let results: OkPacketAgainstEvent[] = [];
    let elapsedTime = 0;
    const interval = 500;
    const maxWaitingTime = 3000;

    const checkRelays = () => {
      const defaultRelays = Object.keys(_rxNostr.getDefaultRelays());

      // 成功したリレーが1つもないかチェック
      const hasSuccess = results.some((packet) => packet.ok);

      // 送信成功も失敗も受信していないリレーが存在するかチェック
      const pendingRelays = defaultRelays.filter(
        (relay) => !results.some((packet) => packet.from === relay)
      );
      console.log("未応答のリレー:", pendingRelays.length);
      if (
        !hasSuccess &&
        pendingRelays.length > 0 &&
        elapsedTime < maxWaitingTime
      ) {
        elapsedTime += interval;
        setTimeout(checkRelays, interval);
      } else {
        resolve(results);
      }
    };

    // 1秒ごとにチェック、最大3秒待つ
    setTimeout(checkRelays, interval);

    _rxNostr.send(event).subscribe({
      next: (packet) => {
        console.log(
          `リレー ${packet.from} への送信が ${
            packet.ok ? "成功" : "失敗"
          } しました。`
        );
        results.push(packet);
      },
      complete: () => resolve(results),
    });
  }).then((res) => ({ event, res }));
}
export async function promisePublishEvent(
  ev: Nostr.EventParameters
): Promise<{ event: Nostr.Event; res: OkPacketAgainstEvent[] }> {
  const signer = nip07Signer();
  const event = await signer.signEvent(ev);

  return promisePublishSignedEvent(event);
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
  if (Object.entries(get(defaultRelays)).length == 0) {
    return;
  }
  //これわざわざエラーのときってしなくてもエラーとリジェクトの時いがいりコネクトされないらしい
  //------------------------------------------------------------------------　default relays🦌リコネクトできないから要修正
  Object.entries(get(defaultRelays)).forEach(([key, value], index) => {
    if (get(app).rxNostr.getRelayStatus(key)?.connection === "error") {
      get(app).rxNostr.reconnect(key);
      rxNostr3ReccoctRelay(key);
    }
  });
  //rxNostr3RelaysReconnectChallenge();
}
export function reconnectRelay(url: string) {
  get(app).rxNostr.reconnect(url);
  rxNostr3ReccoctRelay(url);
}
// let tieKey: string;
// export function setTieKey(key: string) {
//   tieKey = key;
//   // console.log(tieKey);
// }
export function getRelaysById(id: string, key: string): string[] {
  //console.log(tieMapStore);
  const tieMap: Map<string, Set<string>> | undefined =
    get(tieMapStore)?.[key]?.[1];

  return Array.from(tieMap?.get(id) || []);
}
export function usePromiseReq(
  {
    filters,
    operator,
    req,
    initData = [],
  }: UsePromiseReqOpts<EventPacket[] | EventPacket>,
  relays: string[] | undefined,
  timeout: number | undefined = 3000
): Promise<EventPacket[]> {
  const _rxNostr = get(app).rxNostr;
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    console.log("error");
    throw Error("No default relays available");
  }

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
    _req = createRxBackwardReq();
  }
  // 初期データが配列でない場合は、配列に変換
  let accumulatedData: EventPacket[] = Array.isArray(initData)
    ? [...initData]
    : [initData];
  //console.log(accumulatedData);
  // const tie =
  //   tieKey !== "undefined" ? get(tieMapStore)?.[tieKey]?.[0] : undefined;

  const obs: Observable<EventPacket[] | EventPacket> = _rxNostr
    .use(_req, { relays: relays })
    .pipe(metadata(), operator, completeOnTimeout(timeout));
  // tie
  //   ? _rxNostr
  //       .use(_req, { relays: relays })
  //       .pipe(tie, metadata(), operator, completeOnTimeout(timeout)) // muteCheck(),
  //   : _rxNostr
  //       .use(_req, { relays: relays })
  //       .pipe(metadata(), operator, completeOnTimeout(timeout)); //muteCheck(),

  return new Promise<EventPacket[]>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      resolve(accumulatedData);
    }, timeout + 10000); // Timeout after 3 seconds if not completed

    const subscription = obs.subscribe({
      next: (v: EventPacket[] | EventPacket) => {
        //  console.log(v);
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

export interface MetadataList {
  [key: string]: UserData;
}
export interface UserData {
  name: string | undefined;
  display_name: string | undefined;
  nip05: string | undefined;
  petname: string | undefined;
}
export function getMetadataList(
  querydata: [QueryKey, EventPacket][]
): MetadataList {
  return querydata.reduce((acc: MetadataList, [key, packet]) => {
    try {
      const profile: Profile = JSON.parse(packet.event.content);
      const pubkey = nip19.npubEncode(packet.event.pubkey);
      const petname = get(followList).get(packet.event.pubkey);
      // 新しいプロファイルデータを結果に追加
      acc[pubkey] = {
        name: profile.name,
        display_name: profile.display_name,
        nip05: profile.nip05,
        petname: petname,
      };
    } catch (error) {
      console.error("Error parsing profile:", error);
    }
    return acc; // 蓄積された結果を返す
  }, {} as MetadataList);
}
