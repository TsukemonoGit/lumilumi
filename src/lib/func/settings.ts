import { latestEachNaddr, latestbyId, scanArray } from "$lib/stores/operators";
import { relaySearchRelays } from "$lib/stores/relays";
import { app, loginUser, queryClient, verifier } from "$lib/stores/stores";
import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";
import type {
  LumiMuteByKindList,
  LumiSetting,
  MuteList,
  Theme,
} from "$lib/types";
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
import { emojiShortcodeRegex, nip33Regex } from "./util";

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
  const rxNostr = createRxNostr({ verifier: get(verifier) ?? cryptoVerifier });
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
  const rxNostr = createRxNostr({ verifier: get(verifier) ?? cryptoVerifier });
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relays);

  const event = await new Promise<EventPacket>((resolve) => {
    let res: EventPacket;
    setTimeout(() => {
      subscription.unsubscribe();
      rxNostr.dispose();
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

export async function getQueryRelays(pubkey: string) {
  let defaultRelayData = get(queryClient)?.getQueryData([
    "defaultRelay",
    pubkey,
  ] as QueryKey);
  console.log(defaultRelayData);

  if (!defaultRelayData) {
    console.log("t");
    const relayList = await getRelayList(pubkey);
    console.log(relayList);
    if (relayList.length > 0) {
      get(queryClient).setQueryData(["defaultRelay", pubkey], relayList);
    } else {
      console.log("failed to get relay data");
      return;
    }
  }
  defaultRelayData = get(queryClient)?.getQueryData([
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
  try {
    const privateContent = await (
      window?.nostr as Nostr.Nip07.Nostr
    )?.nip04?.decrypt(get(loginUser), event.content);
    if (privateContent) {
      const parsedContent: string[][] = JSON.parse(privateContent);
      if (parsedContent.length > 0) {
        tags = parsedContent;
      }
    }
  } catch (error) {
    console.log("failed to decrypt");
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
  rxNostr: RxNostr,
  filters: Filter[],
  relays: DefaultRelayConfig[] | undefined
): Promise<EventPacket[]> {
  // const rxNostr = createRxNostr({ verifier: get(verifier) ?? cryptoVerifier });
  const rxReq = createRxBackwardReq();
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
  const rxNostr = createRxNostr({ verifier: get(verifier) ?? cryptoVerifier });
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
  packets: EventPacket[],
  beforeMuteByList: LumiMuteByKindList[] | undefined
): Promise<LumiMuteByKindList[]> {
  let muteByList: LumiMuteByKindList[] = [];

  for (const packet of packets) {
    const beforeData = beforeMuteByList?.find(
      (list) => list.event?.kind === packet.event.kind
    );
    if (
      beforeData &&
      beforeData.event &&
      beforeData.event.pubkey === packet.event.pubkey &&
      beforeData.event.created_at >= packet.event.created_at
    ) {
      muteByList.push(beforeData);
    } else {
      const kind = Number(
        packet.event.tags.filter((tag) => tag[0] === "d").map((tag) => tag[1])
      );
      if (kind) {
        let pTags = packet.event.tags
          .filter((tag) => tag[0] === "p")
          .map((tag) => tag[1]);

        if (packet.event.content.length > 0) {
          const privateTags = await decryptContent(packet.event);
          if (privateTags && privateTags.length > 0) {
            const ppTags = privateTags
              .filter((tag: string[]) => tag[0] === "p")
              .map((tag: string[]) => tag[1]);
            if (ppTags.length > 0) {
              pTags = [...pTags, ...ppTags];
            }
          }
        }

        if (pTags.length > 0) {
          const existingKind = muteByList.find((item) => item.kind === kind);
          if (existingKind) {
            muteByList = muteByList.reduce(
              (pre, cur) => {
                if (cur.kind === packet.event.kind) {
                  return [
                    ...pre,
                    {
                      kind: packet.event.kind,
                      list: pTags,
                      event: packet.event,
                    },
                  ];
                } else {
                  return [...pre, cur];
                }
              },
              [] as {
                kind: number;
                list: string[];
                event: Nostr.Event | undefined;
              }[]
            );
          } else {
            muteByList.push({ kind, list: pTags, event: packet.event });
          }
        }
      }
    }
  }
  return muteByList;
}

async function decryptContent(event: Nostr.Event): Promise<string[][] | null> {
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

export async function migrateSettings() {
  const STORAGE_KEY = "lumiSetting";
  const lumiEmoji_STORAGE_KEY = "lumiEmoji";
  const lumiMute_STORAGE_KEY = "lumiMute";
  const lumiMuteByKind_STORAGE_KEY = "lumiMuteByKind";
  let savedSettings = localStorage.getItem(STORAGE_KEY);

  if (!savedSettings) return;

  const settings: LumiSetting = JSON.parse(savedSettings);

  // LumiEmojiを別のキーに移動
  if (settings.emoji) {
    localStorage.setItem(lumiEmoji_STORAGE_KEY, JSON.stringify(settings.emoji));
    delete settings.emoji; // lumisettingから削除
  }

  // LumiMuteを別のキーに移動
  if (settings.mute) {
    localStorage.setItem(lumiMute_STORAGE_KEY, JSON.stringify(settings.mute));
    delete settings.mute; // lumisettingから削除
  }

  // LumiMuteByKindを別のキーに移動
  if (settings.mutebykinds) {
    localStorage.setItem(
      lumiMuteByKind_STORAGE_KEY,
      JSON.stringify(settings.mutebykinds)
    );
    delete settings.mutebykinds; // lumisettingから削除
  }

  // 変更後の設定を再保存
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

  console.log("Settings migration completed.");
}

export async function createEmojiListFrom10030(
  event: Nostr.Event
): Promise<string[][]> {
  //10030に直emojiになってるやつをまずlistに追加
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

  //10030のatagたちをフィルターにする
  const naddrFilters = event.tags.reduce(
    (acc: Nostr.Filter[], [tag, value]) => {
      console.log(tag, value);
      if (tag === "a") {
        const matches = value.match(nip33Regex);
        console.log(matches);
        if (matches) {
          const filter: Nostr.Filter = {
            kinds: [Number(matches[1])],
            authors: [matches[2]],
            "#d": [matches[3]],
            //limit: 1,
          };

          return [...acc, filter];
        } else {
          return acc;
        }
      } else {
        return acc;
      }
    },
    []
  );

  //チャンクに分ける
  const chunkedFilters: Filter[][] = chunkArray(naddrFilters, 10);

  // 全てのチャンクを並列で処理する
  const pkListArray = await Promise.all(
    chunkedFilters.map((chunk) =>
      getNaddrEmojiList(get(app).rxNostr, chunk, undefined)
    )
  );

  if (pkListArray.length > 0) {
    //重複しないように整える

    // フラット化して一つの配列にする
    const flattenedList = pkListArray.flat();

    // dtag をキーとして最新のイベントをマップに格納
    const latestEventsMap = new Map<string, EventPacket>();

    flattenedList.forEach((packet) => {
      const dTag = packet.event.tags.find((tag) => tag[0] === "d")?.[1];
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
    latestEventsMap.forEach((pk) => {
      if (pk && pk.event) {
        list = [
          ...list,
          ...pk.event.tags.reduce((acc: string[][], [tag, shortcode, url]) => {
            if (tag === "emoji" && emojiShortcodeRegex.test(shortcode)) {
              return [...acc, [shortcode, url]];
            } else {
              return acc;
            }
          }, []),
        ];
      }
    });
  }
  return list;
}

// フィルターを5個ずつのチャンクに分割する関数
function chunkArray(array: Filter[], chunkSize: number) {
  return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  );
}
