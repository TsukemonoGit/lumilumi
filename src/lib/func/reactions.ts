import { app, queryClient, verifier } from "$lib/stores/stores";
import type { UseReqOpts3, ReqStatus } from "$lib/types";
import { createQuery } from "@tanstack/svelte-query";
import {
  createRxNostr,
  createRxForwardReq,
  type EventPacket,
  type RxNostr,
  filterByKind,
  filterByKinds,
} from "rx-nostr";
import { get, writable, derived, type Readable } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";
import { zapCheck } from "$lib/stores/operators";
import { verifier as cryptoVerifier } from "rx-nostr-crypto";

let rxNostr3: RxNostr;

// const rxNostr3 = createRxNostr({
//   verifier: get(verifier) ?? cryptoVerifier,
//   connectionStrategy: "aggressive",
// }); //reaction repost用

export function set3Relays(relays: any) {
  if (!rxNostr3) {
    rxNostr3 = createRxNostr({
      verifier: get(verifier) ?? cryptoVerifier,
      connectionStrategy: "aggressive",
    }); //reaction repost用
  }
  rxNostr3.setDefaultRelays(relays);
}
export function rxNostr3RelaysReconnectChallenge() {
  const relays = rxNostr3.getDefaultRelays();
  if (relays && Object.entries(relays).length > 0) {
    Object.entries(relays).forEach(([key, value], index) => {
      if (rxNostr3.getRelayStatus(key)?.connection === "error") {
        console.log(key);
        rxNostr3.reconnect(key);
      }
    });
  }
}
const req3 = createRxForwardReq();

export function changeEmit(filters: Nostr.Filter[]) {
  console.log(filters);
  req3.emit(filters);
}

export function useReq3({
  operator,
  filters,
  req,
  initData,
}: UseReqOpts3<EventPacket>): {
  data: Readable<EventPacket | undefined>;
  status: Readable<ReqStatus>;
  error: Readable<Error>;
} {
  console.log(filters);

  const _queryClient = get(queryClient);

  if (!_queryClient) {
    throw new Error("Query client is not available");
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const obs: Observable<EventPacket> = rxNostr3
    .use(req3)
    .pipe(operator, zapCheck());

  const query = createQuery({
    queryKey: ["reactions"],
    queryFn: (): Promise<EventPacket> => {
      return new Promise((resolve, reject) => {
        // let fulfilled = false;

        obs.pipe(filterByKind(7)).subscribe({
          next: (v: EventPacket) => {
            //  if (fulfilled) {
            const etags = v.event.tags.filter((item) => item[0] === "e");

            if (etags.length > 0) {
              _queryClient.setQueryData(
                ["reactions", "reaction", etags[etags.length - 1][1]],
                v
              );
            }
            // } else {
            //   resolve(v);
            //   fulfilled = true;
            // }
          },
          complete: () => status.set("success"),
          error: (e) => {
            console.error("[rx-nostr3]", e);
            status.set("error");
            error.set(e);

            // if (!fulfilled) {
            //   reject(e);
            //   fulfilled = true;
            // }
          },
        });
        obs.pipe(filterByKinds([6, 16])).subscribe({
          next: (v: EventPacket) => {
            //  if (fulfilled) {
            const etags = v.event.tags.filter((item) => item[0] === "e");

            if (etags.length > 0) {
              _queryClient.setQueryData(
                ["reactions", "repost", etags[etags.length - 1][1]],
                v
              );
            }
            // } else {
            //   resolve(v);
            //   fulfilled = true;
            // }
          },
          complete: () => status.set("success"),
          error: (e) => {
            console.error("[rx-nostr3]", e);
            status.set("error");
            error.set(e);

            // if (!fulfilled) {
            //   reject(e);
            //   fulfilled = true;
            // }
          },
        });
        obs.pipe(filterByKind(9735)).subscribe({
          next: (v: EventPacket) => {
            //    if (fulfilled) {
            const etags = v.event.tags.filter((item) => item[0] === "e");

            if (etags.length > 0) {
              _queryClient.setQueryData(
                ["reactions", "zapped", etags[etags.length - 1][1]],
                v
              );
            }
            // } else {
            //   resolve(v);
            //   fulfilled = true;
            // }
          },
          complete: () => status.set("success"),
          error: (e) => {
            console.error("[rx-nostr3]", e);
            status.set("error");
            error.set(e);

            // if (!fulfilled) {
            //   reject(e);
            //   fulfilled = true;
            // }
          },
        });
      });
    },
  });

  return {
    data: derived(query, ($query) => $query.data, initData),
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
