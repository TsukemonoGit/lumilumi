import type { EventPacket } from "rx-nostr";
import { latestEach } from "rx-nostr";
import type { OperatorFunction } from "rxjs";
import { filter, map, pipe, scan, tap } from "rxjs";
import {
  followList,
  loginUser,
  metadataQueue,
  mutebykinds,
  mutes,
  onlyFollowee,
  queryClient,
  reactionToast,
  userStatusStore,
} from "./stores";
import { get } from "svelte/store";
import * as Nostr from "nostr-typedef";
import { sortEventPackets } from "$lib/func/util";
import {
  createQuery,
  type QueryKey,
  type SetDataOptions,
} from "@tanstack/svelte-query";

import {
  muteCheck as muteCheckEvent,
  type MuteCheck,
} from "$lib/func/muteCheck";

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

export function scanArray<A extends EventPacket>(): OperatorFunction<A, A[]> {
  return scan((acc: A[], a: A) => {
    const queryKey: QueryKey = ["timeline", a.event.id];
    // クエリデータの設定
    if (
      a.event &&
      a.event.id &&
      //   a.event.kind !== 30315 &&
      !get(queryClient).getQueryData(queryKey)
    ) {
      // if (get(queryClient)) {
      //   createQuery({
      //     queryKey: queryKey,
      //     staleTime: 2 * 60 * 60 * 1000,
      //     gcTime: 2 * 60 * 60 * 1000,
      //     initialDataUpdatedAt: undefined,
      //     refetchInterval: Infinity,
      //     queryFn: () => a,
      //   });}
      get(queryClient).setQueryData(queryKey, a);
    }

    // 新しい順にソート

    //insertEventPacketIntoDescendingList(acc, a)にしてみてたけどなんかめっちゃ遅くなったからソートに戻す
    const sorted = sortEventPackets([...acc, a]); //.sort((a, b) => b.event.created_at - a.event.created_at);

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

export function metadata(): OperatorFunction<EventPacket, EventPacket> {
  return tap((event: EventPacket) => {
    if (event.event.kind === 0) {
      metadataQueue.update((queue) => [
        ...queue,
        [["metadata", event.event.pubkey], event],
      ]);
    }
  });
}

export function userStatus(): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet: EventPacket) => {
    if (packet.event.kind !== 30315) {
      return true;
    } //30315以外は何もせず通過

    const dtag = packet.event.tags.find((tag) => tag[0] === "d")?.[1];
    if (!dtag) {
      return false;
    }
    //console.log(packet);

    // 現在の store から pubkey と dtag に対応するイベントを取得
    const pre: Nostr.Event | undefined = get(userStatusStore)
      .get(packet.event.pubkey)
      ?.get(dtag);

    // 以前のイベントが存在しないか、作成日時が新しい場合に更新
    if (!pre || packet.event.created_at > pre.created_at) {
      // store を更新
      userStatusStore.update((store) => {
        // pubkey に対応する Map を取得または初期化
        let pubkeyMap = store.get(packet.event.pubkey);
        if (!pubkeyMap) {
          pubkeyMap = new Map<string, Nostr.Event>();
          store.set(packet.event.pubkey, pubkeyMap);
        }

        // dtag に対応するイベントをセット
        pubkeyMap.set(dtag, packet.event);

        return store;
      });

      //  const pre: EventPacket | undefined = get(queryClient).getQueryData([
      //     "userStatus",
      //     dtag,
      //     packet.event.pubkey,
      //   ]);
      //   //const updatedAt = Date.now() + 12 * 60 * 60 * 1000;
      //   if (!pre || packet.event.created_at > pre.event.created_at) {
      //     get(queryClient).setQueryData(
      //       ["userStatus", dtag, packet.event.pubkey],
      //       packet
      //     );
      //   }
      // console.log(
      //   "key:",
      //   ["userStatus", dtag, packet.event.pubkey],
      //   "data:",
      //   get(queryClient).getQueryData([
      //     "userStatus",
      //     dtag,
      //     packet.event.pubkey,
      //   ])
      // );
    }

    return false; //30315は通過させずストアにいれるだけ
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
  const pMutes = get(mutes)?.list.p || [];
  return pMutes.includes(eventPacket.event.pubkey); // Replace with actual property check
}

function shouldMuteByWord(eventPacket: EventPacket): boolean {
  const wordMutes = get(mutes)?.list.word || [];
  //----------------------------------------------------------------------ワードミュートはとりあえずkind:1,7,42に限ってみる
  // Check if any word mute from wordMutes array is included in eventPacket.event.content
  return (
    (eventPacket.event.kind === 1 ||
      eventPacket.event.kind === 7 ||
      eventPacket.event.kind === 42) &&
    wordMutes.some((muteWord) => eventPacket.event.content.includes(muteWord))
  );
}

function shouldMuteByT(eventPacket: EventPacket): boolean {
  const tMutes = get(mutes)?.list.t || [];

  // Find all tags in eventPacket.event.tags where tag[0] is "t"
  const tagsWithT = eventPacket.event.tags.filter((tag) => tag[0] === "t");

  // Check if any tag[1] (the value of the tag where tag[0] === "t") is in tMutes
  return tagsWithT.some((tag) => tMutes.includes(tag[1]));
}

function shouldMuteByE(eventPacket: EventPacket): boolean {
  const eMutes = get(mutes)?.list.e || [];
  // const tagsWithE = eventPacket.event.tags.filter(
  //   (tag) => tag[0] === "e" || tag[0] === "q"
  // );
  return eMutes.includes(eventPacket.event.id); //||
  //  tagsWithE.some((tag) => eMutes.includes(tag[1])) // Replace with actual property check
}

function shouldMuteByKinds(eventPacket: EventPacket): boolean {
  const kindsMutes = get(mutebykinds).list || [];

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

export function zapCheck() {
  return filter((event: EventPacket) => {
    if (event.event.kind !== 9735) {
      return true; // kindが9735でない場合はtrueを返す（イベントを通過させる）
    }

    const pub = zappedPubkey(event.event);
    if (pub === get(loginUser)) {
      return true; // kindが9735で、かつpubがget(loginUser)と一致する場合はtrueを返す（イベントを通過させる）
    } else {
      return false; // 上記以外の場合はfalseを返す（イベントを通過させない）
    }
  });
}

export const zappedPubkey = (event: Nostr.Event): string | undefined => {
  try {
    return JSON.parse(
      event.tags.find((tag) => tag[0] === "description")?.[1] ?? ""
    ).pubkey;
  } catch (error) {
    return undefined;
  }
};

export function reactionCheck() {
  return filter((packet: EventPacket) => {
    //ここでミュートチェックしたらリアクション以外にも関わるから下でやる
    const follow = get(followList);
    if (
      packet.event.kind === 1 ||
      packet.event.kind === 6 ||
      packet.event.kind === 16
    ) {
      //自分のpubがtagsに入っていてもリアクションとして取得したものじゃない可能性があるkind

      if (
        packet.event.pubkey !== get(loginUser) &&
        packet.event.tags.find(
          (tag) => tag[0] === "p" && tag[1] === get(loginUser)
        )
      ) {
        //自分の投稿への反応

        if (follow && follow.has(packet.event.pubkey)) {
          console.log("includes", packet.event);
          //自分の投稿への反応のうちフォロイーからのものは普通にTLに流れるポスト
          setReactionEvent(packet);

          console.log(get(reactionToast));
          return true;
        } else {
          if (muteCheckEvent(packet.event) !== "null") {
            return false;
          }
          //自分の投稿への反応のうちフォロー外からのものはリアクションとして通知するだけでTLには流さない
          if (!get(onlyFollowee)) {
            //フォロー外の通知ONのときだけ追加
            setReactionEvent(packet);
          }
          return false;
        }
      } else {
        //自分のPが含まれない普通の投稿だからそのまま流す
        return true;
      }
    } else {
      if (
        packet.event.pubkey !== get(loginUser) &&
        packet.event.tags.find(
          (tag) => tag[0] === "p" && tag[1] === get(loginUser)
        )
      ) {
        //TLには流れないものたちのうち自分へのリアクション

        if (follow && follow.has(packet.event.pubkey)) {
          //自分の投稿への反応のうちフォロイーからのもの
          setReactionEvent(packet);
        } else {
          //自分の投稿への反応のうちフォロー外からのもの
          if (!get(onlyFollowee)) {
            //フォロー外の通知ONのときだけ追加
            setReactionEvent(packet);
          }
        }
      }

      return false;
    }
  });
}

const observedEvents = new Set<string>();
function setReactionEvent(packet: EventPacket) {
  //重複チェク
  //未観測の場合のみ追加

  if (observedEvents.has(packet.event.id)) {
    return; // 既に観測されている場合は何もしない
  }

  // 未観測の場合のみ追加
  observedEvents.add(packet.event.id);

  reactionToast.set({
    title: "",
    description: JSON.stringify(packet.event),
    color: "",
  });
}
