import { latestEachNaddr, latestbyId, scanArray } from "$lib/stores/operators";
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

export async function getRelayList(pubkey: string): Promise<EventPacket[]> {
  const rxNostr = createRxNostr({ verifier: verifier.get() ?? cryptoVerifier });
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relaySearchRelays);
  let res: EventPacket[] = [];
  await new Promise<void>((resolve) => {
    const subscription = rxNostr
      .use(rxReq)
      .pipe(uniq(), scanArray(), completeOnTimeout(3000))
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
  let defaultRelayData = queryClient?.getQueryData([
    "defaultRelay",
    pubkey,
  ] as QueryKey);
  console.log(defaultRelayData);

  if (!defaultRelayData) {
    // console.log("t");
    const relayList = await getRelayList(pubkey);
    console.log(relayList);
    if (relayList.length > 0) {
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
  const data: EventPacket[] = defaultRelayData as EventPacket[];

  const kind10002 = data.find((packet) => packet.event.kind === 10002);
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

export async function createEmojiListFrom10030(
  event: Nostr.Event,
  rxNostr: RxNostr | undefined = undefined,
  relays: DefaultRelayConfig[] | undefined = undefined,
  onProgress?: ProgressCallback
): Promise<string[][]> {
  // ステップ1: 直接の絵文字を抽出
  onProgress?.(1, 4, {
    directEmojiCount: 0,
  });

  let list: string[][] = event.tags.reduce(
    (acc: string[][], [tag, shortcode, url]) => {
      if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
        return [...acc, [shortcode, url]];
      } else {
        return acc;
      }
    },
    []
  );

  onProgress?.(1, 4, {
    directEmojiCount: list.length,
  });

  // ステップ2: 10030のatagたちをフィルターにする
  const naddrFilters: { id: string; filter: Nostr.Filter }[] = (
    event.tags as string[][]
  ).reduce((acc: { id: string; filter: Nostr.Filter }[], [tag, value]) => {
    console.log(tag, value);
    if (tag === "a") {
      const matches = value.match(nip33Regex);
      console.log(matches);
      if (matches) {
        const filter: Nostr.Filter = {
          kinds: [Number(matches[1])],
          authors: [matches[2]],
          "#d": [matches[3]],
          limit: 1,
        };

        // フィルタを結果に追加
        acc.push({ id: value, filter: filter });
      }
    }
    return acc;
  }, [] as { id: string; filter: Nostr.Filter }[]);

  console.log(naddrFilters);
  const chunkedFilters = chunkArray(
    naddrFilters.map((fil) => fil.filter),
    20
  );

  onProgress?.(2, 4, {
    filterCount: naddrFilters.length,
    chunkCount: chunkedFilters.length,
  });

  // ステップ3: 全てのチャンクを並列処理する
  let completedChunks = 0;

  // 並列処理で全チャンクを処理
  const pkListArray: any[][] = await Promise.all(
    chunkedFilters.map(async (chunk, i) => {
      try {
        const chunkResult = await getNaddrEmojiList(rxNostr, chunk, relays);

        // 完了したチャンクをカウント
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
        return []; // エラーの場合は空配列を返す
      }
    })
  );

  // ステップ4: 結果を統合
  onProgress?.(4, 4, {
    processedCount: pkListArray.flat().length,
  });

  if (pkListArray.length > 0) {
    // フラット化して一つの配列にする
    const flattenedList = pkListArray.flat();

    // dtag をキーとして最新のイベントをマップに格納
    const latestEventsMap = new Map<string, any>();

    flattenedList.forEach((packet) => {
      const dTag = packet.event.tags.find(
        (tag: string[]) => tag[0] === "d"
      )?.[1];
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

    // 各チャンクの結果を結合する
    const sortedLatestEvents = naddrFilters.map((filter) => {
      const id = filter.id;
      const event = Array.from(latestEventsMap.values()).find((pk) => {
        const kind = pk.event.kind;
        const pubkey = pk.event.pubkey;
        const dTag = pk.event.tags.find((tag: string[]) => tag[0] === "d")?.[1];
        return `${kind}:${pubkey}:${dTag}` === id;
      });
      return event;
    });

    // 各チャンクの結果を結合する
    sortedLatestEvents.forEach((pk) => {
      if (pk && pk.event) {
        list = [
          ...list,
          ...pk.event.tags.reduce(
            (acc: string[][], [tag, shortcode, url]: string[]) => {
              if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
                return [...acc, [shortcode, url]];
              } else {
                return acc;
              }
            },
            []
          ),
        ];
      }
    });
  }

  // 最終ステップ: 完了
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
