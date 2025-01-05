import { app, defaultRelays, queryClient, verifier } from "$lib/stores/stores";
import type { UseReqOpts3, ReqStatus } from "$lib/types";
import { createQuery } from "@tanstack/svelte-query";
import { createRxNostr, createRxForwardReq, type EventPacket } from "rx-nostr";
import { get, writable, derived, type Readable } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";
//import { zapCheck } from "$lib/stores/operators";
import { verifier as cryptoVerifier } from "rx-nostr-crypto";
import { zappedPubkey } from "$lib/stores/operators";
import { sortEventPackets } from "./util";

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
    verifier: get(verifier) ?? cryptoVerifier,
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
      verifier: get(verifier) ?? cryptoVerifier,
      connectionStrategy: "lazy-keep",
    }); //reaction repost用
  }
  get(app).rxNostr3.setDefaultRelays(relays);
}

export function rxNostr3RelaysReconnectChallenge() {
  if (Object.entries(get(defaultRelays)).length == 0) {
    return;
  }
  if (Object.entries(get(app).rxNostr3.getDefaultRelays()).length <= 0) {
    get(app).rxNostr3.setDefaultRelays(get(defaultRelays));
  } else {
    Object.entries(get(defaultRelays)).forEach(([key, value], index) => {
      if (value.read) {
        get(app).rxNostr3.reconnect(key);
      }
    });
  }
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

export function useReq3({ operator }: UseReqOpts3<EventPacket>): {
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

  const obs: Observable<EventPacket> = get(app)
    .rxNostr3.use(req3)
    .pipe(operator);

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
  const etag = v.event.tags.findLast(
    (item) => item[0] === "e" || item[0] === "a"
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
