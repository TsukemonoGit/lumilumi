import { app, queryClient } from "$lib/stores/stores";
import type { UseReqOpts3, ReqStatus } from "$lib/types";
import { createQuery } from "@tanstack/svelte-query";
import { createRxNostr, createRxForwardReq, type EventPacket } from "rx-nostr";
import { get, writable, derived, type Readable } from "svelte/store";
import { Observable } from "rxjs";
import * as Nostr from "nostr-typedef";
import { zapCheck } from "$lib/stores/operators";
import { verifier } from "rx-nostr-crypto";

const rxNostr3 = createRxNostr({
  verifier: verifier,
  connectionStrategy: "aggressive",
}); //reaction repost用

export function set3Relays(relays: any) {
  rxNostr3.setDefaultRelays(relays);
}

const req3 = createRxForwardReq();

export function changeEmit(filters: Nostr.Filter[]) {
  console.log(filters);
  req3.emit(filters);
}

export function useReq3({
  rxNostr,
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
        let fulfilled = false;

        obs.subscribe({
          next: (v: EventPacket) => {
            if (fulfilled) {
              const etag = v.event.tags.find((item) => item[0] === "e");
              if (v.event.kind === 7 && etag) {
                _queryClient.setQueryData(
                  ["reactions", "reaction", etag[1]],
                  v
                );
              } else if ((v.event.kind === 6 || v.event.kind === 16) && etag) {
                _queryClient.setQueryData(["reactions", "repost", etag[1]], v);
              } else if (v.event.kind === 9735 && etag) {
                _queryClient.setQueryData(["reactions", "zapped", etag[1]], v);
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
