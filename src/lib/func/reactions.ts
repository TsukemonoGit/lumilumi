import { app, defaultRelays, queryClient } from "$lib/stores/stores";
import type { UseReqOpts3, ReqStatus } from "$lib/types";
import { createQuery } from "@tanstack/svelte-query";
import {
  createRxNostr,
  createRxForwardReq,
  type EventPacket,
  type ConnectionState,
} from "rx-nostr";
import { get, writable, derived, type Readable } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";
//import { zapCheck } from "$lib/stores/operators";
import { verifier as cryptoVerifier } from "rx-nostr-crypto";
import { zappedPubkey } from "$lib/stores/operators";
import { sortEventPackets } from "./util";
import { authRelay, verifier } from "$lib/stores/globalRunes.svelte";

// const rxNostr3 = createRxNostr({
//   verifier: get(verifier) ?? cryptoVerifier,
//   connectionStrategy: "aggressive",
// }); //reaction repost用
const req3 = createRxForwardReq();
export function setRxNostr3() {
  if (get(app)?.rxNostr3) {
    return;
  }
  const rxNostr3 = createRxNostr({
    verifier: verifier.get() ?? cryptoVerifier,
    connectionStrategy: "lazy-keep",
  });
  app.update((be) => {
    return { ...be, rxNostr3: rxNostr3 };
  });

  // rxNostr3.createConnectionStateObservable().subscribe((packet) => {
  //   //  console.log(`${packet.from} の接続状況が ${packet.state} に変化しました。`);
  //   relayStateMap3.update((value) => value.set(packet.from, packet.state));
  // });
}
export function set3Relays(relays: any) {
  if (!get(app).rxNostr3) {
    get(app).rxNostr3 = createRxNostr({
      verifier: verifier.get() ?? cryptoVerifier,
      connectionStrategy: "lazy-keep",
    }); //reaction repost用
  }
  get(app).rxNostr3.setDefaultRelays(relays);
}

export async function rxNostr3RelaysReconnectChallenge() {
  if (Object.entries(get(defaultRelays)).length == 0) {
    return;
  }
  //AUTHチャレンジが必要なリレーは除く
  const relays = Object.entries(get(defaultRelays)).filter(
    ([key, value]) =>
      value.read &&
      !authRelay.get().includes(key) &&
      get(app).rxNostr3.getRelayStatus(key)?.connection === "error"
  );
  if (relays.length === 0) return;

  relays.forEach(([key, value]) => {
    get(app).rxNostr.reconnect(key);
  });
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
      const status = get(app).rxNostr3.getRelayStatus(relayUrl)?.connection;

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

export function rxNostr3Status() {
  console.log(get(app).rxNostr3.getAllRelayStatus());
}
export function rxNostr3ReccoctRelay(url: string) {
  get(app).rxNostr3.reconnect(url);
}

export function changeEmit(filters: Nostr.Filter[]) {
  console.log(filters);
  req3.emit(filters);
}

export function useReq3(): {
  data: Readable<EventPacket | undefined>;
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

  const obs: Observable<EventPacket> = get(app).rxNostr3.use(req3);

  const query = createQuery({
    queryKey: ["reactions"], //TLに表示されているノートたちへのリアクションの監視だからinfinity?
    gcTime: Infinity,
    staleTime: Infinity,
    queryFn: (): Promise<EventPacket> => {
      return new Promise((resolve, reject) => {
        let fulfilled = false;

        obs.subscribe({
          next: (v: EventPacket) => {
            if (fulfilled) {
              handleEvent(v);
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

function handleEvent(v: EventPacket) {
  //console.log(v.event);
  // const etag = v.event.tags.findLast(
  //   (item) => item[0] === "e" || item[0] === "a"
  // );
  //"a" タグがあればそれを優先的に取得
  const etag: string[] | null = v.event.tags.reduceRight(
    (acc: string[] | null, item: string[]) => {
      if (item[0] === "a") return item as string[]; // "a" が見つかったら即決定
      return acc || ((item[0] === "e" ? item : null) as string[] | null); // "e" が見つかったらそれを記憶
    },
    null
  );

  if (etag) {
    let queryKey: [string, string, string, string] | undefined;

    if (v.event.kind === 7) {
      queryKey = ["reactions", etag[1], "reaction", v.event.pubkey];
    } else if (v.event.kind === 6 || v.event.kind === 16) {
      queryKey = ["reactions", etag[1], "repost", v.event.pubkey];
    } else if (v.event.kind === 9735) {
      const zappedUser = zappedPubkey(v.event);
      if (zappedUser) {
        queryKey = ["reactions", etag[1], "zapped", zappedUser];
      }
    }

    if (queryKey) {
      //queryClient.setQueryData([...queryKey, v.event.id], v);
      queryClient.setQueryData(queryKey, (oldData: EventPacket[] = []) => {
        // データの重複を排除し、新しいデータを追加
        const uniqueData = [
          ...oldData.filter((item) => item.event.id !== v.event.id),
          v,
        ];

        // created_at の降順でソート
        return sortEventPackets(uniqueData);
      });
    }
  }
}
