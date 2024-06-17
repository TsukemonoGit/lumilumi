/**
 * @license Apache-2.0
 * @copyright 2023 Akiomi Kamakura
 */

import type { EventPacket } from "rx-nostr";
import { latestEach } from "rx-nostr";
import type { OperatorFunction } from "rxjs";
import { filter, map, pipe, scan, tap } from "rxjs";
import {
  loginUser,
  metadataQueue,
  mutebykinds,
  mutes,
  queryClient,
} from "./stores";
import { get } from "svelte/store";
import * as Nostr from "nostr-typedef";
import type { QueryKey } from "@tanstack/svelte-query";
import type { MuteList } from "$lib/types";

export function filterId(
  id: string
): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet) => packet.event.id === id);
}

export function filterTextList(
  ids: string[]
): OperatorFunction<EventPacket, EventPacket> {
  return filter(({ event }) => event.kind === 1 && ids.includes(event.id));
}

export function filterPubkey(
  pubkey: string
): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet) => packet.event.pubkey === pubkey);
}

export function filterMetadataList(
  pubkeys: string[]
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) => event.kind === 0 && pubkeys.includes(event.pubkey)
  );
}

export function filterNaddr(
  kind: number,
  pubkey: string,
  identifier: string
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) =>
      event.kind === kind &&
      event.pubkey === pubkey &&
      event.tags[0][1] === identifier
  );
}

export function latestEachPubkey(): OperatorFunction<EventPacket, EventPacket> {
  return latestEach(({ event }) => event.pubkey);
}

export function latestEachNaddr(): OperatorFunction<EventPacket, EventPacket> {
  return latestEach(
    ({ event }) => `${event.kind}:${event.pubkey}:${event.tags[0][1]}`
  );
}

export function scanArray<A extends EventPacket>(
  amount: number = 100
): OperatorFunction<A, A[]> {
  return scan((acc: A[], a: A) => {
    // クエリデータの設定
    if (a.event && a.event.id) {
      get(queryClient).setQueryData(["timeline", a.event.id], a);
    }

    // 新しい順にソート
    const sorted = [...acc, a].sort(
      (a, b) => b.event.created_at - a.event.created_at
    );

    // amountを超える古い部分を捨てる
    if (sorted.length > amount) {
      sorted.length = amount;
    }

    return sorted;
  }, []);
}

// export function scanArray0<A>(): OperatorFunction<A, A[]> {
//   return scan((acc: A[], a: A) => [...acc, a], []);
// }
// export function collectGroupBy<A, K>(
//   f: (a: A) => K
// ): OperatorFunction<A, Map<K, A[]>> {
//   return pipe(
//     scanArray0(),
//     map((xs) => {
//       const dict = new Map<K, A[]>();
//       xs.forEach((x) => {
//         const key = f(x);
//         const value = dict.get(key);
//         if (value) {
//           dict.set(key, [...value, x]);
//         } else {
//           dict.set(key, [x]);
//         }
//       });
//       return dict;
//     })
//   );
// }

// export function scanLatestEach<A, K>(f: (a: A) => K): OperatorFunction<A, A[]> {
//   return pipe(
//     collectGroupBy(f),
//     map((dict) =>
//       Array.from(dict.entries()).map(([, value]) => value.slice(-1)[0])
//     )
//   );
// }

export function metadata(
  queryKey: QueryKey
): OperatorFunction<EventPacket, EventPacket> {
  return tap((event: EventPacket) => {
    if (queryKey[0] === "metadata") {
      metadataQueue.update((queue) => [...queue, [queryKey, event]]);
    }
  });
}

export function latestbyId<A extends EventPacket>(): OperatorFunction<A, A[]> {
  return pipe(
    scan((acc: Map<string, A>, eventPacket: A) => {
      const tagValue = getTagValue(eventPacket, "d");
      if (tagValue) {
        const existingPacket = acc.get(tagValue);
        if (
          !existingPacket ||
          existingPacket.event.created_at < eventPacket.event.created_at
        ) {
          acc.set(tagValue, eventPacket);
        }
      }
      return acc;
    }, new Map<string, A>()),
    map((acc) => Array.from(acc.values()))
  );
}

function getTagValue(
  eventPacket: EventPacket,
  tagKey: string
): string | undefined {
  const tag = eventPacket.event.tags.find((tag) => tag[0] === tagKey);
  return tag ? tag[1] : undefined;
}

//get(mutes),get(mutebykinds)
//muteCheck
export function muteCheck(): OperatorFunction<EventPacket, EventPacket> {
  return filter((eventPacket) => {
    if (get(mutes)) {
      // Check if the eventPacket should be muted based on mutes.p
      if (shouldMuteByP(eventPacket)) {
        return false;
      }

      // Check if the eventPacket should be muted based on mutes.word
      if (shouldMuteByWord(eventPacket)) {
        return false;
      }

      // Check if the eventPacket should be muted based on mutes.t
      if (shouldMuteByT(eventPacket)) {
        return false;
      }

      // Check if the eventPacket should be muted based on mutes.e
      if (shouldMuteByE(eventPacket)) {
        return false;
      }
    }

    // Check if the eventPacket should be muted based on mutebykinds
    if (shouldMuteByKinds(eventPacket)) {
      return false;
    }

    // If none of the mute conditions match, allow the eventPacket to pass through
    return true;
  });
}

function shouldMuteByP(eventPacket: EventPacket): boolean {
  const pMutes = get(mutes).p || [];
  return pMutes.includes(eventPacket.event.pubkey); // Replace with actual property check
}

function shouldMuteByWord(eventPacket: EventPacket): boolean {
  const wordMutes = get(mutes).word || [];
  //----------------------------------------------------------------------ワードミュートはとりあえずkind:1に限ってみる
  // Check if any word mute from wordMutes array is included in eventPacket.event.content
  return (
    eventPacket.event.kind === 1 &&
    wordMutes.some((muteWord) => eventPacket.event.content.includes(muteWord))
  );
}

function shouldMuteByT(eventPacket: EventPacket): boolean {
  const tMutes = get(mutes).t || [];

  // Find all tags in eventPacket.event.tags where tag[0] is "t"
  const tagsWithT = eventPacket.event.tags.filter((tag) => tag[0] === "t");

  // Check if any tag[1] (the value of the tag where tag[0] === "t") is in tMutes
  return tagsWithT.some((tag) => tMutes.includes(tag[1]));
}

function shouldMuteByE(eventPacket: EventPacket): boolean {
  const eMutes = get(mutes).e || [];
  const tagsWithE = eventPacket.event.tags.filter(
    (tag) => tag[0] === "e" || tag[0] === "q"
  );
  return (
    eMutes.includes(eventPacket.event.id) ||
    tagsWithE.some((tag) => eMutes.includes(tag[1]))
  ); // Replace with actual property check
}

function shouldMuteByKinds(eventPacket: EventPacket): boolean {
  const kindsMutes = get(mutebykinds) || [];

  // Implement logic to check if eventPacket.kind and other properties match mutebykinds criteria
  // Example logic:

  for (const entry of kindsMutes) {
    if (
      entry.kind === eventPacket.event.kind &&
      entry.list.includes(eventPacket.event.pubkey)
    ) {
      return true;
    }
  }
  return false;
}
