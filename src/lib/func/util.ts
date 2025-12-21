import type { Profile, UserMuteStatus } from "$lib/types";
import * as Nostr from "nostr-typedef";

import { Nip11Registry, type EventPacket } from "rx-nostr";
import type { Nip11 } from "nostr-typedef";
import { binarySearch, normalizeURL } from "nostr-tools/utils";
import * as nip19 from "nostr-tools/nip19";
import { get } from "svelte/store";
import { mutebykinds, mutes } from "$lib/stores/stores";
import { urlRegex } from "./regex";
import type { Attachment } from "svelte/attachments";

export let noReactionKind = [3, 10000, 30000];

export const profile = (ev: Nostr.Event | undefined): Profile | undefined => {
  if (!ev) {
    return undefined;
  }
  try {
    return JSON.parse(ev.content);
  } catch (error) {
    return undefined;
  }
};

//profileがなかったときとかに画面に表示させるpubの省略文字
export const displayShortPub = (hex: string): string => {
  if (!hex) return "";
  try {
    const pub = nip19.npubEncode(hex);
    return `${pub.slice(0, 13)}...${pub.slice(pub.length - 2)}`;
  } catch (error) {
    return `${hex.slice(0, 13)}...${hex.slice(hex.length - 2)}`;
  }
};
export const splitHexColorString = (hexString: string): string[] => {
  if (hexString) {
    return hexString.match(/.{1,6}/g)?.map((segment) => `#${segment}`) || [];
  } else {
    return ["#555555"];
  }
};

// RGB 値を計算する関数
export function calculateColor(hex: string): string {
  if (!hex) {
    return "";
  }
  // 16進数文字列を2文字ずつ分割
  const hexPairs: RegExpMatchArray = hex.match(/.{1,2}/g) as RegExpMatchArray;

  const { r, g, b } = hexPairs.reduce(
    (
      acc: { r: number; g: number; b: number },
      hexPair: string,
      index: number
    ) => {
      const value = parseInt(hexPair, 16);
      if (index % 3 === 0) acc.r = (acc.r + value) % 256;
      else if (index % 3 === 1) acc.g = (acc.g + value) % 256;
      else if (index % 3 === 2) acc.b = (acc.b + value) % 256;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  return `rgb(${r},${g},${b})`;
}

/**
 * 日付の表示オプションを生成
 */
function getDateFormatOptions(
  date: Date,
  now: Date,
  full: boolean
): Intl.DateTimeFormatOptions {
  const sameYear = date.getFullYear() === now.getFullYear();
  const sameMonth = sameYear && date.getMonth() === now.getMonth();
  const sameDay = sameMonth && date.getDate() === now.getDate();

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (full || !sameDay) {
    options.month = "2-digit";
    options.day = "2-digit";
  }

  if (full || !sameYear) {
    options.year = "numeric";
  }

  return options;
}

/**
 * 汎用フォーマット関数（Date）
 */
function formatDateWithOptions(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return date.toLocaleString([], options);
}

/**
 * Unix秒からフォーマット
 */
export function formatAbsoluteDateFromUnix(
  unixTime: number,
  full: boolean = false
): string {
  const date = new Date(unixTime * 1000);
  return formatAbsoluteDateFromDate(date, full);
}

/**
 * Dateからフォーマット
 */
export function formatAbsoluteDateFromDate(
  date: Date,
  full: boolean = false
): string {
  const now = new Date();
  const options = getDateFormatOptions(date, now, full);
  return formatDateWithOptions(date, options);
}

// 日付フォーマット関数
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function formatRelativeDate(
  unixTime: number,
  locale: string | null | undefined
): string {
  const date = new Date(unixTime * 1000);
  const now = new Date();
  const secondsDiff = Math.floor((now.getTime() - date.getTime()) / 1000);

  const minutes = Math.floor(secondsDiff / 60);
  const hours = Math.floor(secondsDiff / 3600);
  const days = Math.floor(secondsDiff / 86400);
  const months = Math.floor(days / 30); // おおよその計算
  const years = Math.floor(days / 365); // おおよその計算

  // ローカライズされたメッセージ
  const messages = {
    en: {
      seconds: "seconds ago",
      minutes: "minutes ago",
      hours: "hours ago",
      days: "days ago",
      months: "months ago",
      years: "years ago",
    },
    ja: {
      seconds: "秒前",
      minutes: "分前",
      hours: "時間前",
      days: "日前",
      months: "ヶ月前",
      years: "年前",
    },
  };

  const msg = locale === "ja" ? messages["ja"] : messages["en"];

  if (secondsDiff < 60) {
    return `${secondsDiff} ${msg.seconds}`;
  } else if (minutes < 60) {
    return `${minutes} ${msg.minutes}`;
  } else if (hours < 24) {
    return `${hours} ${msg.hours}`;
  } else if (days < 30) {
    return `${days} ${msg.days}`;
  } else if (months < 12) {
    return `${months} ${msg.months}`;
  } else {
    return `${years} ${msg.years}`;
  }
}

export function datetime(unixtime: number) {
  const time = new Date(unixtime * 1000);

  return time.toISOString();
}

export const generateResultMessage = (
  isSuccess: string[],
  isFailed: string[]
) => {
  let str = "";
  if (isSuccess.length > 0) {
    str = "OK\n";
    isSuccess.map((item) => (str += `${item}\n`));
    str += "\n";
  }
  // console.log(isFailed);
  if (isFailed.length > 0) {
    str += "Failed\n";
    isFailed.map((item) => (str += `${item}\n`));
  }
  return str;
};

export const getRelayInfo = async (
  url: string
): Promise<Nip11.RelayInfo | undefined> => {
  const relayInfo = Nip11Registry.get(url);
  if (relayInfo) {
    //	console.log(relayInfo);
    return relayInfo;
  } else {
    const fetchInfo = await Nip11Registry.fetch(url);
    //	console.log(fetchInfo);
    return fetchInfo;
  }
};

export function formatUrl(url: string) {
  let httpsUrl = url.startsWith("wss://")
    ? url.replace(/^wss:/, "https:")
    : url.replace(/^ws:/, "http:");
  try {
    return normalizeURL(httpsUrl);
  } catch (error) {
    return url;
  }
}

export const cleanRelayUrl = (url: string) => url.replace(/\/$/, "");

export function sortEventPackets<A extends EventPacket>(events: A[]): A[] {
  return events.sort((a: A, b: A): number => {
    if (a.event.created_at !== b.event.created_at) {
      return b.event.created_at - a.event.created_at;
    }
    return a.event.id.localeCompare(b.event.id);
  });
}
export function sortEvents(events: Nostr.Event[]): Nostr.Event[] {
  return events.sort((a: Nostr.Event, b: Nostr.Event): number => {
    if (a.created_at !== b.created_at) {
      return b.created_at - a.created_at;
    }
    return a.id.localeCompare(b.id);
  });
}
//新しいのが上
export function insertEventPacketIntoDescendingList<A extends EventPacket>(
  sortedArray: A[],
  eventPacket: A
): A[] {
  const [idx, found] = binarySearch(sortedArray, (b: A) => {
    if (eventPacket.event.id === b.event.id) return 0;
    if (eventPacket.event.created_at === b.event.created_at) return -1;
    return b.event.created_at - eventPacket.event.created_at;
  });
  if (!found) {
    sortedArray.splice(idx, 0, eventPacket);
  }
  return sortedArray;
}

//新しいのが下
export function insertEventPacketIntoAscendingList(
  sortedArray: EventPacket[],
  eventPacket: EventPacket
): EventPacket[] {
  const [idx, found] = binarySearch(sortedArray, (b) => {
    if (eventPacket.event.id === b.event.id) return 0;
    if (eventPacket.event.created_at === b.event.created_at) return -1;
    return eventPacket.event.created_at - b.event.created_at;
  });
  if (!found) {
    sortedArray.splice(idx, 0, eventPacket);
  }
  return sortedArray;
}

export function parseNaddr(tag: string[]): nip19.AddressPointer {
  const [, reference, relay] = tag; // 配列の2番目の要素を取り出す
  const [kind, pubkey, ...identifierParts] = reference.split(":"); // referenceをコロンで分割, identifierの中に:が含まれる可能性がある
  const identifier = identifierParts.join(":"); // identifierの部分を結合する
  //console.log(identifier);
  return relay !== undefined && relay !== ""
    ? {
        kind: Number(kind),
        pubkey: pubkey,
        identifier: identifier ?? "",
        relays: [relay],
      }
    : {
        kind: Number(kind),
        pubkey: pubkey,
        identifier: identifier ?? "",
      };
}

export const nip19Decode = (
  content: string | undefined
):
  | { type: "naddr"; data: nip19.AddressPointer }
  | { type: "nevent"; data: nip19.EventPointer }
  | { type: "nprofile"; data: nip19.ProfilePointer }
  | { type: "nsec"; data: Uint8Array }
  | { type: "npub" | "note"; data: string }
  | undefined => {
  if (content === undefined) {
    return undefined;
  }
  // console.log(content);
  try {
    const decoded = nip19.decode(content);
    if (decoded.type === "naddr") {
      return {
        type: decoded.type,
        data: decoded.data as nip19.AddressPointer,
      };
    } else if (decoded.type === "nevent") {
      return { type: decoded.type, data: decoded.data as nip19.EventPointer };
    } else if (decoded.type === "nprofile") {
      return {
        type: decoded.type,
        data: decoded.data as nip19.ProfilePointer,
      };
    } else if (decoded.type === "nsec") {
      return { type: decoded.type, data: decoded.data as Uint8Array };
    } else {
      return { type: decoded.type, data: decoded.data as string };
    }
  } catch (error) {
    return undefined;
  }
};

export function splitArray<T>(array: T[], chunkSize: number): T[][] {
  return array.reduce((acc, _, index) => {
    if (index % chunkSize === 0) {
      acc.push(array.slice(index, index + chunkSize));
    }
    return acc;
  }, [] as T[][]);
}

export function getColor(state: string | undefined): string {
  switch (state) {
    case "initialized":
      return "text-gray-500";
    case "connecting":
      return "text-blue-500";
    case "connected":
      return "text-green-500";
    case "waiting-for-retrying":
    case "retrying":
      return "text-yellow-500";
    case "dormant":
      return "text-purple-500";
    case "error":
    case "rejected":
    case "terminated":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function userMuteStatus(pub: string): UserMuteStatus {
  const list = get(mutebykinds)?.list;
  if (!list || !Array.isArray(list)) {
    return initUserMuteStatus;
  }
  const repoList = list.find((li) => li.kind === 6);
  const reaList = list.find((li) => li.kind === 7);
  const zapList = list.find((li) => li.kind === 9734);
  return {
    user: get(mutes)?.list?.p?.includes(pub),
    repost: repoList?.list?.includes(pub) ? true : false,
    reaction: reaList?.list?.includes(pub) ? true : false,
    zap: zapList?.list?.includes(pub) ? true : false,
  };
}

export const initUserMuteStatus: UserMuteStatus = {
  user: false,
  repost: false,
  reaction: false,
  zap: false,
};

export const nip19UserRegex =
  /nostr:(((npub|nsec|nprofile)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))/g;

export const nip19NoteRegex =
  /nostr:(((naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))/g;

// export const translateText = async (text: string, fetchUserInfo: (key: string) => Promise<string>) => {
//   // nip19UserRegexにマッチする部分を探し、情報を置き換える処理
//   const replacedText = await text.replace(nip19UserRegex, async (match, p1) => {
//     try {
//       // `p1` が `(((npub|nsec|nprofile)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))` に該当する部分
//       const userInfo = await fetchUserInfo(p1);
//       return `[👤${userInfo}]`; // 取得したユーザー情報を表示
//     } catch {
//       return "[👤Unknown]"; // エラー時のフォールバック
//     }
//   });

//   // 他の置換
//   const finalText = replacedText
//     .replace(nip19NoteRegex, "[🗒️]")
//     .replace(urlRegex, "[🔗]");

//   return encodeURIComponent(finalText);
// };
export const replaceText = (text: string) => {
  return text
    .replace(nip19UserRegex, "[👤]")
    .replace(nip19NoteRegex, "[🗒️]")
    .replace(urlRegex, "[🔗]");
};
export const translateText = (text: string) => {
  return encodeURIComponent(replaceText(text));
};

export function formatToEventPacket(
  ev: Nostr.Event,
  from: string = ""
): EventPacket {
  return {
    event: ev,
    from: from,
    type: "EVENT",
    subId: "",
    message: ["EVENT", "", ev],
  } as EventPacket;
}

export function debounce<T extends (...args: any[]) => Promise<void> | void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export function nipLink(str: string): string {
  return `https://github.com/nostr-protocol/nips/blob/master/${str}.md`;
}

// Helper functions
export function getIDbyParam(str: string) {
  const { type, data } = nip19.decode(str);

  if (type === "note") {
    return data as string;
  } else if (type === "nevent") {
    return data.id;
  } else {
    console.log(data);
  }
}
