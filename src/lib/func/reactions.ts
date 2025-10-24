import { app, queryClient } from "$lib/stores/stores";
import type { ReqStatus } from "$lib/types";
import { createQuery } from "@tanstack/svelte-query";
import { createRxForwardReq, type EventPacket } from "rx-nostr";
import { get, writable, derived, type Readable } from "svelte/store";
import { type Observable, type Subscription } from "rxjs";
import * as Nostr from "nostr-typedef";

import { zappedPubkey } from "$lib/stores/operators";
import { sortEventPackets } from "./util";

//forward 1インスタンスにいっこだけと思いきやuseでなんか複数いけるらしい
const reactionlistReq = createRxForwardReq();

export function changeEmit(filters: Nostr.Filter[]) {
  reactionlistReq.emit(filters);
}

export function useReq3(): {
  data: Readable<EventPacket | undefined>;
  status: Readable<ReqStatus>;
  error: Readable<Error>;
} {
  const _queryClient = queryClient;

  if (!_queryClient) {
    throw new Error("Query client is not available");
  }

  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const obs: Observable<EventPacket> = get(app).rxNostr.use(reactionlistReq);

  const query = createQuery({
    queryKey: ["reactions"],
    gcTime: Infinity,
    staleTime: Infinity,
    queryFn: (): Promise<EventPacket> => {
      return new Promise((resolve, reject) => {
        let fulfilled = false;
        let subscription: Subscription | null = null;

        const cleanup = () => {
          if (subscription) {
            subscription.unsubscribe();
            subscription = null;
          }
        };

        subscription = obs.subscribe({
          next: (v: EventPacket) => {
            //console.log(v);
            if (fulfilled) {
              handleEvent(v);
            } else {
              resolve(v);
              fulfilled = true;
            }
          },
          complete: () => {
            status.set("success");
            cleanup();
          },
          error: (e) => {
            console.error("[rx-nostr]", e);
            status.set("error");
            error.set(e);
            cleanup();

            if (!fulfilled) {
              reject(e);
              fulfilled = true;
            }
          },
        });

        // クリーンアップ関数を返す
        return cleanup;
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
