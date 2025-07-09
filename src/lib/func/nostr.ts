import {
  app,
  defaultRelays,
  metadataQueue,
  queryClient,
  tieMap,
} from "$lib/stores/stores";
import type { ReqStatus, Profile, UsePromiseReqOpts } from "$lib/types";
import { createQuery, type QueryKey } from "@tanstack/svelte-query";

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
  createRxForwardReq,
  filterByType,
  type AuthPacket,
} from "rx-nostr";
import { writable, derived, get, type Readable } from "svelte/store";
import { Observable, type OperatorFunction } from "rxjs";
import * as Nostr from "nostr-typedef";
import { bookmark, metadata } from "$lib/stores/operators";
import { set3Relays } from "./reactions";
import { verifier as cryptoVerifier } from "rx-nostr-crypto";
import * as nip19 from "nostr-tools/nip19";
import { hexRegex } from "./regex";
import {
  authRelay,
  followList,
  lumiSetting,
  relayStateMap,
  verifier,
} from "$lib/stores/globalRunes.svelte";

import { validateLoginPubkey } from "./validateLoginPubkey";
import { notificationKinds } from "./constants";
import { SigningError } from "./publishError";

import { throttle } from "$lib/func/throttle";

let rxNostr: RxNostr;
export function setRxNostr() {
  if (get(app)?.rxNostr) {
    return;
  }
  rxNostr = createRxNostr({
    verifier: verifier.get() ?? cryptoVerifier,
    connectionStrategy: "lazy-keep",
    authenticator: "auto", //https://penpenpng.github.io/rx-nostr/ja/v3/auth.html
    eoseTimeout: 10000, //フォワードはEOSEで終わらないから影響しない
  });
  app.update((be) => {
    return { ...be, rxNostr: rxNostr };
  });

  rxNostr.createConnectionStateObservable().subscribe((packet) => {
    //  console.log(`${packet.from} の接続状況が ${packet.state} に変化しました。`);
    relayStateMap.update((value) => {
      return value.set(packet.from, packet.state);
    });
  });

  rxNostr
    .createAllMessageObservable()
    .pipe(filterByType("AUTH"))
    .subscribe(
      (
        e: AuthPacket & {
          type: "AUTH";
        }
      ) => {
        console.log("AUTH", e);
        if (!authRelay.get().includes(e.from)) {
          authRelay.update((v) => [...v, e.from]);
        }
        console.log("authRelay", authRelay.get());
      }
    );
}

export function setRelays(relays: AcceptableDefaultRelaysConfig) {
  console.log(relays);
  if (rxNostr && defaultRelays) {
    rxNostr.setDefaultRelays(relays);
    defaultRelays.set(rxNostr.getDefaultRelays());
  }
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
  if (followList.get().size > 0) {
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
  const followingMap = contacts.tags.reduce(
    (acc, [tag, value, relay, petname]) => {
      // "p" タグのチェック
      //ちゃんとvalueがpubhexかかくにんしないといけない
      if (tag === "p" && !acc.has(value) && hexRegex.test(value)) {
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

  //followList.set(new Map(followingMap));
  return followingMap;
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

  if (followList.get().has(data.event.pubkey)) {
    if (existingIndex !== -1) {
      // 既に保存されているデータがある場合、上書きする
      if (
        data.event.created_at >
        currentMetadata[existingIndex][1].event.created_at
      ) {
        //新しいデータだったら上書き
        currentMetadata[existingIndex] = [key, data];
        queryClient.setQueryData(key, (oldData: any) => data);
        metadataChanged = true;
      } else {
        //古いデータだったら保存されてる方を返す
        // 保存されているメタデータの方をクエリにセット（？）
        queryClient.setQueryData(
          key,
          (oldData: any) => currentMetadata[existingIndex][1]
        );
      }
    } else {
      // 保存されていない場合、新しいデータを追加する
      currentMetadata.push([key, data]);
      queryClient.setQueryData(key, (oldData: any) => data);
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

  // queryKeyがオブジェクトや配列の場合、JSON.stringifyを使って比較
  const result = metadata.find(
    ([key, _]) => JSON.stringify(key) === JSON.stringify(queryKey)
  );
  //console.log(result);
  return result ? result[1] : undefined;
};

export function generateRandomId(length: number = 6): string {
  return Array.from({ length }, () => Math.random().toString(36)[2]).join("");
}
const req = createRxForwardReq();

export function changeMainEmit(filters: Nostr.Filter[]) {
  console.log("changeMainEmit", filters);

  req.emit(filters);
}
export const makeMainFilters = (
  contacts: Nostr.Event<number>,
  since: number
): { mainFilters: Nostr.Filter[]; olderFilters: Nostr.Filter[] } => {
  //console.log(contacts);

  const pubkeyList = pubkeysIn(contacts, lumiSetting.get().pubkey);

  const kinds = [1, 6];
  if (lumiSetting.get().showKind16) {
    kinds.push(16);
  }

  console.log("kind42inTL", lumiSetting.get().kind42inTL);
  if (lumiSetting.get().kind42inTL) {
    kinds.push(42);
  }
  const olderFilters: Nostr.Filter[] = [
    {
      authors: Array.from(pubkeyList.keys()),
      kinds: [...kinds],
      since: since,
    },
  ];
  if (lumiSetting.get().showImg) {
    //画像読み込みのときはkind:0リアルタイム更新
    kinds.push(0);
  }
  const filters: Nostr.Filter[] = [
    {
      authors: Array.from(pubkeyList.keys()),
      kinds: kinds,
      since: since,
    },
  ];

  if (lumiSetting.get().showReactioninTL) {
    filters.push({
      kinds: notificationKinds,
      "#p": [lumiSetting.get().pubkey],
      since: since,
    });
  } //とりあえず通知をTLに流したくないときは フィルターから外してみる

  if (lumiSetting.get().showUserStatus) {
    filters.push({
      kinds: [30315],
      authors: Array.from(pubkeyList.keys()),
    });
  }

  //bookmarkイベントの更新もリアルタイムでチェック
  filters.push({
    kinds: [10003],
    authors: [lumiSetting.get().pubkey],
  });
  console.log(filters);

  return { mainFilters: filters, olderFilters: olderFilters };
};
//これメインTL用のreqで一つだけのforwardreqのやつ
//rxNostr3ようのやつは別であるけど
//changeMainEmitでフィルターを更新する
export function useMainTimelineReq(
  operator: OperatorFunction<EventPacket, EventPacket | EventPacket[]>,
  queryKey: QueryKey,
  filters: Nostr.Filter[]
): {
  data: Readable<EventPacket | EventPacket[] | undefined>;
  status: Readable<ReqStatus>;
  error: Readable<Error>;
} {
  //console.log(filters);

  const _queryClient = queryClient;

  if (!_queryClient) {
    throw new Error("Query client is not available");
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const obs: Observable<EventPacket | EventPacket[]> = get(app)
    .rxNostr.use(req)
    .pipe(metadata(), bookmark(), operator);

  const query = createQuery({
    queryKey: queryKey,
    gcTime: Infinity,
    staleTime: Infinity,
    queryFn: (): Promise<EventPacket | EventPacket[]> => {
      return new Promise((resolve, reject) => {
        let fulfilled = false;

        obs.subscribe({
          next: (v: EventPacket | EventPacket[]) => {
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
          },
        });
        changeMainEmit(filters);
      });
    },
  });

  return {
    data: derived(query, ($query) => $query.data, undefined),
    status: derived([query, status], ([$query, $status]) => {
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
  event: Nostr.Event,
  relays?: string[] | undefined
): Promise<{ event: Nostr.Event; res: OkPacketAgainstEvent[] }> {
  const _rxNostr = get(app).rxNostr;
  if (!relays && Object.entries(_rxNostr.getDefaultRelays()).length === 0) {
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

    _rxNostr.send(event, { relays: relays }).subscribe({
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
  ev: Nostr.EventParameters,
  relays?: string[] | undefined
): Promise<{ event: Nostr.Event; res: OkPacketAgainstEvent[] }> {
  try {
    const signer = nip07Signer();
    const event = await signer.signEvent(ev);
    return promisePublishSignedEvent(event, relays);
  } catch (error: any) {
    if (error.message.includes("invalid plaintext size")) {
      throw new SigningError("イベントデータのサイズが無効", "INVALID_SIZE");
    }
    if (error.message.includes("User rejected")) {
      throw new SigningError("署名がキャンセルされました", "USER_REJECTED");
    }
    throw new SigningError(`署名エラー: ${error.message}`, "SIGNING_FAILED");
  }
}

export function relaysReconnectChallenge() {
  //AUTHチャレンジが必要なリレーは除く
  const relays = Object.entries(get(defaultRelays)).filter(([key, value]) => {
    const isRead = value.read; //リードリレーのみ
    const notAuth = !authRelay.get().includes(key); //アウスに含まれないリレーのみ
    const connectError =
      get(app).rxNostr.getRelayStatus(key)?.connection === "error"; //エラーリレーのみ
    /*  console.log(
      "isRead",
      isRead,
      "notAuth",
      notAuth,
      "connectError",
      connectError
    ); */
    return isRead && notAuth && connectError;
  });
  if (relays.length === 0) return;

  relays.forEach(([key, value]) => {
    get(app).rxNostr.reconnect(key);
  });

  // コメントアウトされたコードもこの方が自然
  // for (const [key, value] of relays) {
  //   get(app).rxNostr.reconnect(key);
  //   // 接続が完了するまで待機する
  //   await waitForConnection(key);
  // }
}

// 接続完了を待機する補助関数
async function waitForConnection(relayUrl: string, timeout = 5000) {
  return new Promise<void>((resolve) => {
    // ここで明示的に Promise<void> と型を指定
    const checkInterval = 300; // 300msごとにチェック
    const maxAttempts = timeout / checkInterval;
    let attempts = 0;

    const checkConnection = () => {
      attempts++;
      const status = get(app).rxNostr.getRelayStatus(relayUrl)?.connection;

      // 接続済みまたはエラー終了の場合は完了
      if (
        status === "connected" ||
        status === "error" ||
        status === "rejected"
      ) {
        resolve(); // 値なしで resolve を呼び出す
        return;
      }

      // タイムアウトした場合も次に進む
      if (attempts >= maxAttempts) {
        console.warn(`Connection timeout for relay: ${relayUrl}`);
        resolve(); // 値なしで resolve を呼び出す
        return;
      }

      // まだ接続中なら再度チェック
      setTimeout(checkConnection, checkInterval);
    };

    // 初回チェック開始
    checkConnection();
  });
}

export function reconnectRelay(url: string) {
  get(app).rxNostr.reconnect(url);
}

export function getRelaysById(id: string): string[] {
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
  timeout: number | undefined = 3000,
  onData?: (data: EventPacket[]) => void, // 処理途中のデータを受け取るコールバック
  sift?: number
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

  const obs: Observable<EventPacket[] | EventPacket> = _rxNostr
    .use(_req, { relays: relays })
    .pipe(
      metadata(),
      bookmark(),

      operator,
      completeOnTimeout(timeout)
    );

  const throttledOnData = onData ? throttle(onData, 200) : undefined;

  return new Promise<EventPacket[]>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      resolve(accumulatedData.slice(0, sift === 0 ? undefined : sift));
    }, timeout + 10000);

    const subscription = obs.subscribe({
      next: (v: EventPacket[] | EventPacket) => {
        // 受け取ったデータが配列でない場合、配列に変換して追加
        if (Array.isArray(v)) {
          accumulatedData = v;
        } else {
          accumulatedData.push(v);
        }

        // 処理途中のデータを都度コールバックで返す
        if (throttledOnData) {
          throttledOnData(
            [...accumulatedData].slice(0, sift === 0 ? undefined : sift)
          );
        }
      },
      complete: () => {
        clearTimeout(timeoutId);
        resolve(accumulatedData.slice(0, sift === 0 ? undefined : sift));
      },
      error: (e) => {
        console.log(e);
        console.error("[rx-nostr]", e);
        clearTimeout(timeoutId);
        resolve(accumulatedData.slice(0, sift === 0 ? undefined : sift));
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
      const petname = followList.get().get(packet.event.pubkey);
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

export async function deleteEvent(tags: string[][]): Promise<{
  event: Nostr.Event;
  res: OkPacketAgainstEvent[];
}> {
  const checkPub = await validateLoginPubkey();
  if (!checkPub.status) {
    throw new Error(checkPub.message);
  }
  const eventParam: Nostr.EventParameters = {
    kind: 5,
    content: "",
    tags: tags,
  };
  const relays = get(app)?.rxNostr?.getDefaultRelays();
  console.log(relays);
  if (!relays) {
    throw new Error("No default relays found.");
  }
  const keys = Object.keys(relays);
  return await promisePublishEvent(eventParam, keys);
}
