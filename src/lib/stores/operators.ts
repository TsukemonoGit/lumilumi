import type { EventPacket } from "rx-nostr";
import { latestEach } from "rx-nostr";
import type { OperatorFunction } from "rxjs";
import { filter, from, map, mergeMap, of, pipe, scan, tap } from "rxjs";
import { metadataQueue, queryClient, reactionToast } from "./stores";
import { get } from "svelte/store";
import * as Nostr from "nostr-typedef";
import { sortEventPackets } from "$lib/func/util";
import { type QueryKey } from "@tanstack/svelte-query";

import { muteCheck, muteCheck as muteCheckEvent } from "$lib/func/muteCheck";
import {
  bookmark10003,
  followList,
  lumiSetting,
  notifiSettings,
  timelineFilter,
  userStatusMap,
} from "$lib/stores/globalRunes.svelte";
import { SvelteMap } from "svelte/reactivity";
import { isAddressableKind, isReplaceableKind } from "nostr-tools/kinds";
import { urlRegex } from "$lib/func/regex";
import { userPromiseUrl } from "$lib/func/useUrl";
import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

export function createTie<P extends EventPacket>(): [
  OperatorFunction<P, P & { seenOn: Set<string>; isNew: boolean }>,
  Map<string, Set<string>>
] {
  const memo = new Map<string, Set<string>>();

  return [
    pipe(
      map((packet) => {
        if (!packet?.event) {
          const seenOn = new Set<string>();
          return {
            ...packet,
            seenOn,
            isNew: false,
          } as P & { seenOn: Set<string>; isNew: boolean };
        }

        const seenOn = memo.get(packet.event.id) ?? new Set<string>();
        const isNew = seenOn.size <= 0;

        if (!memo.get(packet.event.id)?.has(packet.from)) {
          seenOn.add(packet.from);
          memo.set(packet.event.id, seenOn);
        }

        return {
          ...packet,
          seenOn,
          isNew,
        };
      })
    ),
    memo,
  ];
}

export function filterId(
  id: string
): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet) => !!packet?.event && packet.event.id === id);
}

export function filterTextList(
  ids: string[]
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) => !!event && event.kind === 1 && ids.includes(event.id)
  );
}

export function filterPubkey(
  pubkey: string
): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet) => !!packet?.event && packet.event.pubkey === pubkey);
}

export function filterMetadataList(
  pubkeys: string[]
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) => !!event && event.kind === 0 && pubkeys.includes(event.pubkey)
  );
}

export function filterNaddr(
  kind: number,
  pubkey: string,
  identifier: string
): OperatorFunction<EventPacket, EventPacket> {
  return filter(
    ({ event }) =>
      !!event &&
      event.kind === kind &&
      event.pubkey === pubkey &&
      !!event.tags?.[0]?.[1] &&
      event.tags[0][1] === identifier
  );
}

export function latestEachPubkey(): OperatorFunction<EventPacket, EventPacket> {
  return latestEach(({ event }) => event.pubkey);
}

export function latestEachNaddr(): OperatorFunction<EventPacket, EventPacket> {
  return pipe(
    filter((packet) => !!packet?.event),
    latestEach(
      ({ event }) => `${event.kind}:${event.pubkey}:${event.tags[0][1]}`
    )
  );
}

const createEventQueryKey = (ev: Nostr.Event): QueryKey | null => {
  if (ev.kind === 0) {
    return null;
    //
  } else if (isAddressableKind(ev.kind) && isReplaceableKind(ev.kind)) {
    return [
      "naddr",
      `${ev.kind}:${ev.pubkey}:${
        ev.tags.find((tag) => tag[0] === "d")?.[1] || ""
      }`,
    ] as QueryKey;
  } else if (ev.id) {
    return ["note", ev.id] as QueryKey;
  }
  return null;
};

export function saveEachNote(): OperatorFunction<EventPacket, EventPacket> {
  return tap((pk: EventPacket) => {
    if (pk.event && pk.event.id) {
      const queryKey: QueryKey | null = createEventQueryKey(pk.event);
      // クエリデータの設定
      if (queryKey && !queryClient.getQueryData(queryKey)) {
        queryClient.setQueryData(queryKey, pk);
      }
    }
  });
}

export function scanArray<A extends EventPacket>(
  sift?: number
): OperatorFunction<A, A[]> {
  return scan((acc: A[], a: A) => {
    // 新しい順にソート

    //insertEventPacketIntoDescendingList(acc, a)にしてみてたけどなんかめっちゃ遅くなったからソートに戻す
    const sorted = sortEventPackets([...acc, a]); //.sort((a, b) => b.event.created_at - a.event.created_at);
    // siftが設定されている場合は指定された件数でちぎる
    if (sift !== undefined) {
      return sorted.slice(0, sift === 0 ? undefined : sift);
    }
    return sorted;
  }, []);
}

export function metadata(): OperatorFunction<EventPacket, EventPacket> {
  return tap((event: EventPacket) => {
    if (event.event?.kind === 0) {
      metadataQueue.update((queue) => [
        ...queue,
        [["metadata", event.event.pubkey], event],
      ]);
    }
  });
}
export function bookmark(): OperatorFunction<EventPacket, EventPacket> {
  return tap((pk: EventPacket) => {
    if (!pk?.event) return;
    //最新のブックマークイベントをクエリーに入れてローカルストレージに保存
    if (
      pk.event.kind === 10003 &&
      pk.event.pubkey === lumiSetting.get().pubkey
    ) {
      const queryKey: QueryKey = ["naddr", `${10003}:${pk.event.pubkey}:`];

      const preMeta: EventPacket | undefined =
        queryClient.getQueryData(queryKey);
      if (!preMeta || pk.event.created_at > preMeta.event.created_at) {
        queryClient.setQueryData(queryKey, pk);
        localStorage?.setItem(STORAGE_KEYS.BOOKMARK, JSON.stringify(pk));
        bookmark10003.set(pk.event);
      }
    }
  });
}

export function userStatus(): OperatorFunction<EventPacket, EventPacket> {
  return filter((packet: EventPacket) => {
    if (!packet?.event || packet.event.kind !== 30315) {
      return true;
    } //30315以外は何もせず通過

    const dtag = packet.event.tags.find((tag) => tag[0] === "d")?.[1];
    if (!dtag) {
      return false;
    }

    // 現在の store から pubkey と dtag に対応するイベントを取得
    const pubkeyMap = userStatusMap.get(packet.event.pubkey);
    const pre: Nostr.Event | undefined = pubkeyMap?.get(dtag);

    // 以前のイベントが存在しないか、作成日時が新しい場合に更新
    if (!pre || packet.event.created_at > pre.created_at) {
      // pubkey に対応する Map を取得または初期化
      let targetMap = userStatusMap.get(packet.event.pubkey);
      if (!targetMap) {
        targetMap = new SvelteMap<string, Nostr.Event>();
        userStatusMap.set(packet.event.pubkey, targetMap);
      }

      // dtag に対応するイベントをセット
      targetMap.set(dtag, packet.event);
    }

    return false; //30315は通過させずストアにいれるだけ
  });
}

export function latestbyId<A extends EventPacket>(): OperatorFunction<A, A[]> {
  return pipe(
    scan((acc: Map<string, A>, eventPacket: A) => {
      if (eventPacket?.event) {
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
  const tag = eventPacket.event?.tags?.find((tag) => tag[0] === tagKey);
  return tag ? tag[1] : undefined;
}

export function zapCheck() {
  return filter((event: EventPacket) => {
    if (!event?.event || event.event.kind !== 9735) {
      return true; // kindが9735でない場合はtrueを返す（イベントを通過させる）
    }

    const pub = zappedPubkey(event.event);
    if (pub === lumiSetting.get().pubkey) {
      return true; // kindが9735で、かつpubがlumiSetting.get().pubkeyと一致する場合はtrueを返す（イベントを通過させる）
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

/**
 * タイムライン表示およびリアクション通知を処理するイベントフィルター
 * @param show リアクションイベントを通知トーストとして表示するかどうか
 */
export function reactionCheck(show: boolean) {
  return filter((packet: EventPacket) => {
    if (!packet?.event) return false;
    // イベントとログインユーザーの情報を取得
    const { event } = packet;
    const loginUserPubkey = lumiSetting.get().pubkey;

    // フォロー中かどうかを判定するヘルパー関数
    const isFollowingUser = (pubkey: string): boolean =>
      followList.get()?.has(pubkey) ?? false;

    // 自分の投稿かどうか
    const isSelfPost = event.pubkey === loginUserPubkey;

    // 投稿に自分のユーザーID（pタグ）が含まれているか
    const containsUserTag = event.tags.some(
      (tag) => tag[0] === "p" && tag[1] === loginUserPubkey
    );

    // タイムラインに通常表示されるイベント種別を定義
    const isTargetEventKind = [1, 6, 16, 42].includes(event.kind);

    // タイムラインに流さず、自分へのリアクションとして処理されるイベントか
    const isReactionEvent =
      !isTargetEventKind && containsUserTag && !isSelfPost;

    // 通知を設定するヘルパー関数
    const maybeSetReaction = (canShow: boolean) => {
      // 'show' が true で、かつ条件を満たす場合に通知をセット
      if (show && canShow) {
        setReactionEvent(packet);
      }
    };

    // タイムラインに表示されるイベント種別の処理
    if (isTargetEventKind) {
      // 自分の投稿へのメンションやリプライがある場合
      if (!isSelfPost && containsUserTag) {
        const isFollower = isFollowingUser(event.pubkey);

        // 自分のフォロイーからの反応
        if (isFollower) {
          // タイムラインに表示し、ミュートされていなければ通知をセット
          maybeSetReaction(muteCheckEvent(event) === "null");
          return true;
        } else {
          // フォロー外からの反応は通知のみ
          const canShow =
            muteCheckEvent(event) === "null" &&
            !notifiSettings.get().onlyFollowee;
          maybeSetReaction(canShow);
          return false;
        }
      } else {
        // それ以外（自分への言及がない通常の投稿）はタイムラインに流す
        return true;
      }
    }

    // リアクションイベント（タイムラインに流さない）の処理
    if (isReactionEvent) {
      // フォロイーからのリアクション、または「フォロイーのみ」設定がオフの場合に通知をセット
      const isFollower = isFollowingUser(event.pubkey);
      const canShow = isFollower || !notifiSettings.get().onlyFollowee;
      maybeSetReaction(canShow);
    }

    // タイムラインに流さない場合はfalseを返す
    return false;
  });
}

const observedEvents = new Set<string>();

function setReactionEvent(packet: EventPacket) {
  if (!packet?.event) return;
  //重複チェク
  //未観測の場合のみ追加
  //最後かチェック
  if (observedEvents.has(packet.event.id)) {
    return; // 既に観測されている場合は何もしない
  }

  // 未観測の場合のみ追加
  //ミュートチェックする
  if (!timelineFilter.adaptMute || muteCheck(packet.event) === "null") {
    observedEvents.add(packet.event.id);

    reactionToast.set({
      title: "",
      description: JSON.stringify(packet.event),
      color: "",
    });
  }
}

//media用

const mediaTypes = ["image", "svg", "movie", "audio", "3D"] as const;
type MediaType = (typeof mediaTypes)[number];

// 結果の型定義
export interface MediaResult {
  eventPacket: EventPacket;
  mediaUrl: string;
  mediaType: MediaType;
}

// オペレーターの状態管理用の型
export interface MediaOperatorState {
  result: MediaResult;
  oldestCreatedAt: number;
  totalPacketsProcessed: number;
}
export interface MediaOperatorOutput {
  result: MediaResult[];
  oldestCreatedAt: number;
  totalPacketsProcessed: number;
}

export interface MediaEvent {
  eventPacket: EventPacket;
  mediaUrl: string;
  mediaType: MediaType;
}
const extractMediaUrls = (content: string): string[] => {
  const urls = content.match(urlRegex) || [];
  return urls.filter((url) => url.length > 0);
};

// 個別の結果を返すmediaOperator
export const mediaOperator = (sift: number) => {
  let eventBuffer: EventPacket[] = [];

  return pipe(
    mergeMap((eventPacket: EventPacket) => {
      if (!eventPacket?.event) {
        return from([]);
      }

      eventBuffer.push(eventPacket);

      // sift制限（古いものを先に切る）
      if (sift !== 0 && eventBuffer.length >= sift) {
        eventBuffer = sortEventPackets(eventBuffer).slice(0, sift);
        // console.log(eventBuffer[sift - 1].event.created_at);
      }

      const urls = extractMediaUrls(eventPacket.event.content ?? "");

      return from(urls).pipe(
        mergeMap(async (url) => {
          const mediaType = await userPromiseUrl(url);
          if (mediaType && mediaTypes.includes(mediaType as MediaType)) {
            return {
              eventPacket,
              mediaUrl: url,
              mediaType: mediaType as MediaType,
              createdAt: eventPacket.event.created_at,
            };
          }
          return null;
        }),
        filter(
          (result): result is MediaResult & { createdAt: number } =>
            result !== null
        ),
        // 🟢 最後に createdAt を eventBuffer から求めて添付
        map((result) => ({
          result,
          oldestCreatedAt:
            eventBuffer.length >= sift
              ? eventBuffer[sift - 1].event.created_at
              : eventBuffer[eventBuffer.length - 1].event.created_at,
          totalPacketsProcessed: eventBuffer.length,
        }))
      );
    })
  );
};
