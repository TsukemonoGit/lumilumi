import {
  latestEachNaddr,
  latestbyId,
  saveEachNote,
  scanArray,
} from "$lib/stores/operators";
import { relaySearchRelays } from "$lib/stores/relays";
import { app, queryClient } from "$lib/stores/stores";
import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";
import type { LumiMuteByKindList, MuteList, Theme } from "$lib/types";
import type { QueryKey } from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";
import * as Nostr from "nostr-typedef";
import {
  completeOnTimeout,
  createRxBackwardReq,
  createRxNostr,
  latest,
  uniq,
  type DefaultRelayConfig,
  type EventPacket,
  type RxNostr,
} from "rx-nostr";
import { verifier as cryptoVerifier } from "rx-nostr-crypto";
import { get } from "svelte/store";
import { emojiShortcodeRegex, nip33Regex } from "./regex";
import { verifier } from "$lib/stores/globalRunes.svelte";

export function setTheme(theme: Theme) {
  if (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export async function getRelayList(
  pubkey: string
): Promise<EventPacket | null> {
  const rxNostr = createRxNostr({ verifier: verifier.get() ?? cryptoVerifier });
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relaySearchRelays);
  let res: EventPacket | null = null;
  await new Promise<void>((resolve) => {
    const subscription = rxNostr
      .use(rxReq)
      .pipe(uniq(), completeOnTimeout(3000))
      .subscribe({
        next: (packet) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          subscription.unsubscribe();
          // rxNostr.dispose();
          resolve();
        },
      });

    rxReq.emit([
      //   { authors: [pubkey], kinds: [3], limit: 1 },
      { authors: [pubkey], kinds: [10002], limit: 1 },
    ]);
  });

  console.log("kekka", res);
  return res;
}

export async function getDoukiList(
  filters: Filter[],
  relays: DefaultRelayConfig[]
): Promise<EventPacket> {
  const rxNostr = createRxNostr({ verifier: verifier.get() ?? cryptoVerifier });
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relays);

  const event = await new Promise<EventPacket>((resolve) => {
    let res: EventPacket;
    setTimeout(() => {
      subscription.unsubscribe();
      //rxNostr.dispose();
      resolve(res);
    }, 7000); //completeOnTimeoutでおわらないことないとおもうけどいちおう

    const subscription = rxNostr
      .use(rxReq)
      .pipe(uniq(), latest(), completeOnTimeout(4000))
      .subscribe({
        next: (packet) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          subscription.unsubscribe();
          // rxNostr.dispose();
          resolve(res);
        },
      });

    rxReq.emit(filters);
  });

  console.log("kekka", event);
  return event;
}

export async function getQueryRelays(
  pubkey: string
): Promise<DefaultRelayConfig[] | undefined> {
  let defaultRelayData: EventPacket | null | undefined =
    queryClient?.getQueryData(["defaultRelay", pubkey] as QueryKey);
  console.log(defaultRelayData);

  if (!defaultRelayData) {
    // console.log("t");
    const relayList = await getRelayList(pubkey);
    console.log(relayList);
    if (relayList) {
      queryClient.setQueryData(["defaultRelay", pubkey], relayList);
    } else {
      console.log("failed to get relay data");
      return;
    }
  }
  defaultRelayData = queryClient?.getQueryData([
    "defaultRelay",
    pubkey,
  ] as QueryKey);
  console.log(defaultRelayData);

  if (!defaultRelayData) {
    return;
  }
  //けっきょく10002しか見てないから
  const kind10002 = defaultRelayData;
  // const kind3 = data.find((packet) => packet.event.kind === 3);

  const relays =
    kind10002 !== undefined
      ? setRelaysByKind10002(kind10002.event)
      : //    : kind3 !== undefined
        //    ? setRelaysByKind3(kind3.event)
        [];

  return relays;
}

export async function toMuteList(event: Nostr.Event): Promise<MuteList> {
  let tags: string[][] = [];
  const muteList: MuteList = {
    p: [],
    word: [],
    t: [],
    e: [],
  };
  if (event.content !== "") {
    try {
      const privateContent = await (
        window?.nostr as Nostr.Nip07.Nostr
      )?.nip04?.decrypt(event.pubkey, event.content);
      if (privateContent) {
        const parsedContent: string[][] = JSON.parse(privateContent);
        if (parsedContent.length > 0) {
          tags = parsedContent;
        }
      }
    } catch (error) {
      console.log("failed to decrypt");
    }
  }
  tags = [...tags, ...event.tags];
  tags.forEach(([tag, content]) => {
    if (tag === "p" || tag === "t" || tag === "word" || tag === "e") {
      muteList[tag].push(content);
    }
  });
  return muteList;
}

export async function getNaddrEmojiList(
  _rxNostr: RxNostr | undefined,
  filters: Filter[],
  relays: DefaultRelayConfig[] | undefined
): Promise<EventPacket[]> {
  // const rxNostr = createRxNostr({ verifier: get(verifier) ?? cryptoVerifier });
  const rxReq = createRxBackwardReq();
  let rxNostr = get(app).rxNostr;
  if (_rxNostr) {
    rxNostr = _rxNostr;
  }
  if (relays) {
    rxNostr.setDefaultRelays(relays);
  }
  const event = await new Promise<EventPacket[]>((resolve) => {
    let res: EventPacket[];

    const subscription = rxNostr
      .use(rxReq)
      .pipe(uniq(), latestEachNaddr(), scanArray(), completeOnTimeout(5000))
      .subscribe({
        next: (packet: EventPacket[]) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          subscription.unsubscribe();
          // rxNostr.dispose();
          resolve(res);
        },
      });

    rxReq.emit(filters);
  });

  console.log("kekka", event);
  return event;
}

export async function getMutebykindList(
  filters: Filter[],
  relays: DefaultRelayConfig[]
): Promise<EventPacket[]> {
  const rxNostr = createRxNostr({ verifier: verifier.get() ?? cryptoVerifier });
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relays);

  const event = await new Promise<EventPacket[]>((resolve) => {
    let res: EventPacket[];
    setTimeout(() => {
      subscription.unsubscribe();
      rxNostr.dispose();
      resolve(res);
    }, 7000); //completeOnTimeoutでおわらないことないとおもうけどいちおう

    const subscription = rxNostr
      .use(rxReq)
      .pipe(uniq(), latestbyId(), completeOnTimeout(4000))
      .subscribe({
        next: (packet) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          subscription.unsubscribe();
          //    rxNostr.dispose();
          resolve(res);
        },
      });

    rxReq.emit(filters);
  });

  console.log("kekka", event);
  return event;
}

//pachet[]をmutebykindのほぞんのかたちにする
export async function getMuteByList(
  events: Nostr.Event[],
  beforeMuteByList: LumiMuteByKindList[] | undefined
): Promise<LumiMuteByKindList[]> {
  let muteByList: LumiMuteByKindList[] = [];

  for (const packet of events) {
    const beforeData = beforeMuteByList?.find(
      (list) =>
        list.event?.tags.find((tag) => tag[0] === "d")?.[1] ===
        packet.tags.find((tag) => tag[0] === "d")?.[1]
    );

    // 前回データがあり、同じpubkeyで、より新しい場合は既存データを使用
    if (
      beforeData &&
      beforeData.event?.pubkey === packet.pubkey &&
      beforeData.event.created_at >= packet.created_at
    ) {
      muteByList.push(beforeData);
    } else {
      // "d" タグからkindを取得
      const kindTag = packet.tags.find((tag) => tag[0] === "d");
      const kind = kindTag ? parseInt(kindTag[1], 10) : undefined;

      if (kind) {
        // "p" タグを取得
        let pTags = packet.tags
          .filter((tag) => tag[0] === "p")
          .map((tag) => tag[1]);

        // コンテンツにデータが含まれている場合、非同期で暗号化されたタグを取得
        if (packet.content.length > 0) {
          const privateTags = await decryptContent(packet);
          if (privateTags && privateTags.length > 0) {
            const ppTags = privateTags
              .filter((tag: string[]) => tag[0] === "p")
              .map((tag: string[]) => tag[1]);
            pTags = [...pTags, ...ppTags];
          }
        }

        if (pTags.length > 0) {
          // muteByListに同じkindが存在するか確認
          const existingKindIndex = muteByList.findIndex(
            (item) => item.kind === kind
          );

          if (existingKindIndex !== -1) {
            // 既存のkindが見つかった場合は新しいイベントで上書き
            muteByList[existingKindIndex] = {
              kind,
              list: pTags,
              event: packet,
            };
          } else {
            // 新しいkindの場合は追加
            muteByList.push({ kind, list: pTags, event: packet });
          }
        }
      }
    }
  }

  return muteByList;
}

export async function decryptContent(
  event: Nostr.Event
): Promise<string[][] | null> {
  try {
    const privateTagsJson = await (
      window?.nostr as Nostr.Nip07.Nostr
    )?.nip04?.decrypt(event.pubkey, event.content);
    return privateTagsJson ? JSON.parse(privateTagsJson) : null;
  } catch (error) {
    console.error("Failed to decrypt content:", error);
    return null;
  }
}

export async function encryptPrvTags(
  pubkey: string,
  prvTags: string[][]
): Promise<string | undefined> {
  try {
    const privateString = await (
      window?.nostr as Nostr.Nip07.Nostr
    )?.nip04?.encrypt(pubkey, JSON.stringify(prvTags));
    return privateString;
  } catch (error) {
    console.error("Failed to decrypt content:", error);
    return undefined;
  }
}
export interface ProgressDetails {
  chunkCount?: number;
  directEmojiCount?: number;
  filterCount?: number;
  processedCount?: number;
  currentChunk?: number;
  chunkResultCount?: number;
  totalEmojis?: number;
}

export type ProgressCallback = (
  current: number,
  total: number,
  details?: ProgressDetails
) => void;

interface FilterWithId {
  id: string;
  filter: Nostr.Filter;
}

// 直接の絵文字を抽出
function extractDirectEmojis(event: Nostr.Event): string[][] {
  return event.tags.reduce((acc: string[][], [tag, shortcode, url]) => {
    if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
      return [...acc, [shortcode, url]];
    }
    return acc;
  }, []);
}

// aタグからフィルターを作成
function createNaddrFilters(event: Nostr.Event): FilterWithId[] {
  return (event.tags as string[][]).reduce(
    (acc: FilterWithId[], [tag, value]) => {
      if (tag === "a") {
        const matches = value.match(nip33Regex);

        // matches が null でない、かつ 必要なグループ数を満たしていることを確認
        if (matches && matches.length >= 4) {
          const kind = Number(matches[1]);
          const pubkey = matches[2];
          const identifier = matches[3];

          if (!isNaN(kind) && pubkey && identifier) {
            const filter: Nostr.Filter = {
              kinds: [kind],
              authors: [pubkey],
              "#d": [identifier],
              limit: 1,
            };
            acc.push({ id: value, filter });
          }
        }
      }
      return acc;
    },
    []
  );
}

// チャンクを並列処理
async function processChunksInParallel(
  chunkedFilters: Nostr.Filter[][],
  rxNostr: RxNostr | undefined,
  relays: DefaultRelayConfig[] | undefined,
  onProgress?: ProgressCallback
): Promise<any[][]> {
  let completedChunks = 0;

  return Promise.all(
    chunkedFilters.map(async (chunk, i) => {
      try {
        const chunkResult = await getNaddrEmojiList(rxNostr, chunk, relays);
        completedChunks++;

        onProgress?.(3, 4, {
          chunkCount: chunkedFilters.length,
          processedCount: completedChunks,
          currentChunk: completedChunks,
          chunkResultCount: chunkResult.length,
        });

        return chunkResult;
      } catch (error) {
        console.error(`チャンク ${i + 1} の処理でエラー:`, error);
        completedChunks++;

        onProgress?.(3, 4, {
          chunkCount: chunkedFilters.length,
          processedCount: completedChunks,
          currentChunk: completedChunks,
          chunkResultCount: 0,
        });

        return [];
      }
    })
  );
}

// イベントから絵文字を抽出
function extractEmojisFromEvent(event: any): string[][] {
  return event.tags.reduce(
    (acc: string[][], [tag, shortcode, url]: string[]) => {
      if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
        return [...acc, [shortcode, url]];
      }
      return acc;
    },
    []
  );
}

// 最新のイベントのマップを作成
function createLatestEventsMap(flattenedList: any[]): Map<string, any> {
  const latestEventsMap = new Map<string, any>();

  flattenedList.forEach((packet) => {
    const dTag = packet.event.tags.find((tag: string[]) => tag[0] === "d")?.[1];
    if (dTag) {
      const existingEvent = latestEventsMap.get(dTag);
      if (
        !existingEvent ||
        packet.event.created_at > existingEvent.event.created_at
      ) {
        latestEventsMap.set(dTag, packet);
      }
    }
  });

  return latestEventsMap;
}

// フィルターに対応するイベントを取得
function getSortedEvents(
  naddrFilters: FilterWithId[],
  latestEventsMap: Map<string, any>
): any[] {
  return naddrFilters.map((filter) => {
    const id = filter.id;
    return Array.from(latestEventsMap.values()).find((pk) => {
      const kind = pk.event.kind;
      const pubkey = pk.event.pubkey;
      const dTag = pk.event.tags.find((tag: string[]) => tag[0] === "d")?.[1];
      return `${kind}:${pubkey}:${dTag}` === id;
    });
  });
}

// 結果を統合
function mergeResults(
  pkListArray: any[][],
  naddrFilters: FilterWithId[]
): string[][] {
  if (pkListArray.length === 0) {
    return [];
  }

  const flattenedList = pkListArray.flat();
  const latestEventsMap = createLatestEventsMap(flattenedList);
  const sortedLatestEvents = getSortedEvents(naddrFilters, latestEventsMap);

  return sortedLatestEvents.reduce((acc: string[][], pk) => {
    if (pk?.event) {
      const emojis = extractEmojisFromEvent(pk.event);
      return [...acc, ...emojis];
    }
    return acc;
  }, []);
}

export async function createEmojiListFrom10030(
  event: Nostr.Event,
  rxNostr: RxNostr | undefined = undefined,
  relays: DefaultRelayConfig[] | undefined = undefined,
  onProgress?: ProgressCallback
): Promise<string[][]> {
  // ステップ1: 直接の絵文字を抽出
  onProgress?.(1, 4, { directEmojiCount: 0 });

  let list = extractDirectEmojis(event);

  onProgress?.(1, 4, { directEmojiCount: list.length });

  // ステップ2: aタグからフィルターを作成
  const naddrFilters = createNaddrFilters(event);
  console.log(naddrFilters);

  const chunkedFilters = chunkArray(
    naddrFilters.map((fil) => fil.filter),
    20
  );

  onProgress?.(2, 4, {
    filterCount: naddrFilters.length,
    chunkCount: chunkedFilters.length,
  });

  // ステップ3: 全てのチャンクを並列処理
  const pkListArray = await processChunksInParallel(
    chunkedFilters,
    rxNostr,
    relays,
    onProgress
  );

  // ステップ4: 結果を統合
  onProgress?.(4, 4, { processedCount: pkListArray.flat().length });

  const mergedEmojis = mergeResults(pkListArray, naddrFilters);
  list = [...list, ...mergedEmojis];

  // 最終レポート
  onProgress?.(4, 4, {
    directEmojiCount: event.tags.filter(([tag]) => tag === "emoji").length,
    filterCount: naddrFilters.length,
    chunkCount: chunkedFilters.length,
    processedCount: pkListArray.flat().length,
    totalEmojis: list.length,
  });

  return list;
}

// フィルターを5個ずつのチャンクに分割する関数
function chunkArray(array: Filter[], chunkSize: number) {
  return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  );
}

export function updateMuteByList(
  tags: string[][],
  ev: Nostr.Event,
  list: LumiMuteByKindList[]
): LumiMuteByKindList[] {
  // 対象の 'p' タグから新しいリストを生成
  const newList = tags
    .filter((tag) => tag[0] === "p" && tag.length > 1)
    .map((tag) => tag[1]);

  // 対象の 'd' タグから kind を取得（'kind' が数値であることを想定）
  const kind = tags.find((tag) => tag[0] === "d" && tag.length > 1)?.[1];

  // 'kind' が存在しない場合、元のリストをそのまま返す
  if (!kind) {
    return list;
  }
  if (!list.find((li) => li.kind === Number(kind))) {
    list.push({ kind: Number(kind), event: ev, list: newList });
    return list;
  }
  return list.reduce((before, cur) => {
    // cur.kind と 'kind' を比較し、異なる場合はそのまま before に追加
    if (cur.kind !== Number(kind)) {
      return [...before, cur];
    } else {
      // 'kind' が一致する場合、新しいイベントとリストに置き換え
      return [...before, { kind: Number(kind), event: ev, list: newList }];
    }
  }, [] as LumiMuteByKindList[]);
}
