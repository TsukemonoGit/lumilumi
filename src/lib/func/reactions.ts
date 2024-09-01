import { queryClient, verifier } from "$lib/stores/stores";
import type { UseReqOpts3, ReqStatus } from "$lib/types";
import { createQuery, QueryClient } from "@tanstack/svelte-query";
import {
  createRxNostr,
  createRxForwardReq,
  type EventPacket,
  type RxNostr,
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

export function rxNostr3ReccoctRelay(url: string) {
  rxNostr3?.reconnect(url);
}
const req3 = createRxForwardReq();

export function changeEmit(filters: Nostr.Filter[]) {
  //  console.log(filters);
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
  //console.log(filters);

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
        let fulfilled = false;

        obs.subscribe({
          next: (v: EventPacket) => {
            if (fulfilled) {
              handleEvent(v, _queryClient);
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

function handleEvent(v: EventPacket, _queryClient: QueryClient) {
  const etag = v.event.tags.findLast(
    (item) => item[0] === "e" || item[0] === "a"
  );

  if (v.event.kind === 7 && etag) {
    _queryClient.setQueryData(["reactions", "reaction", etag[1]], v);
  } else if ((v.event.kind === 6 || v.event.kind === 16) && etag) {
    _queryClient.setQueryData(["reactions", "repost", etag[1]], v);
  } else if (v.event.kind === 9735 && etag) {
    _queryClient.setQueryData(["reactions", "zapped", etag[1]], v);
  }
}
