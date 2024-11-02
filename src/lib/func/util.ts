import type {
  LumiEmoji,
  LumiMute,
  LumiMuteByKind,
  LumiSetting,
  Profile,
  UserMuteStatus,
} from "$lib/types";
import * as Nostr from "nostr-typedef";
import { readServerConfig, type FileUploadResponse } from "nostr-tools/nip96";
import { getToken } from "nostr-tools/nip98";
import { uploadFile } from "./upload";
import { Nip11Registry, type EventPacket } from "rx-nostr";
import type { Nip11 } from "nostr-typedef";
import { binarySearch } from "nostr-tools/utils";
import { nip19 } from "nostr-tools";
import { get } from "svelte/store";
import { mutebykinds, mutes } from "$lib/stores/stores";

export const clientTag = [
  "client",
  "lumilumi",
  "31990:84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5:1727506446612",
  "wss://relay.nostr.band",
];
export const monoZap = {
  endoiunt: "https://coinos.io/api/lnurl/cea7d54f-ac93-4c5b-91c8-8d29c7f51510",

  relays: [
    "wss://nostr.mutinywallet.com",
    "wss://bostr.nokotaro.com",
    "wss://relay.nostr.band/",
    "wss://relay.nostr.wirednet.jp",
  ],
  pubkey: "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5",
  noteId: "df6034a5676deca7bc687abc7dc2ea703a8de01954f0d87879cbc790a5ead234",
};
export const nip50relays = [
  //"wss://relay.nostr.band", //クソ長フィルターのとき（only foloweeのとき）nodataになる
  "wss://search.nos.today",
  // "wss://relay.noswhere.com", //クソ長フィルターのとき（only foloweeのとき）nodataになる /let chank = 100;だと結果出てくる
  "wss://bostr.nokotaro.com",
  "wss://nostr.wine", //クソながフィルターでも返ってくるけどなんかデータがぬけぬけかも？
];

export const mediaUploader = [
  "https://nostrcheck.me",
  "https://nostr.build",
  "https://void.cat",
  "https://files.sovbit.host",
  "https://nostpic.com",
  "https://yabu.me",
];

export const hexRegex = /^[0-9a-fA-F]{64}$/;
//https://api.nostr.watch/v1/nip/50
export const relayRegex =
  /wss?:\/\/[a-zA-Z0-9.-]+(:[0-9]{1,5})?(\/[a-zA-Z0-9._~%+-]*)*/g;
export const relayRegex2 =
  /^wss?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{2,5})?(\/.*)?$/;
//export const relayRegex = /wss?:\/\/\S+/g; ///^wss?:\/\/\S+$/g;
//export const nip33RegexG = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/g;
export const nip33Regex = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/;
export const nip19Regex =
  /nostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))/g; //|(nrelay1[023456789acdefghjklmnpqrstuvwxyz]{20,}
export const nsecRegex = /nsec1[023456789acdefghjklmnpqrstuvwxyz]{58,}/;
export const urlRegex = /(https?:\/\/+[^\s"'<`\]]+[^\s"'<`:\].]+)/g;
export const emojiRegex = /(:[^:\s]+:)/g;
export const emojiShortcodeRegex = /^[a-zA-Z0-9_]+$/;
//export const hashtagRegex = /(?<=^|\s)#(?<hashtag>[\p{Letter}\p{Number}_]+)/gu; //(?<hashtag>...) は、名前付きキャプチャグループ
//export const hashtagRegex =
//  /(?<=^|\s)#(?<hashtag>[a-zA-Z\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}_+-][^#﹟＃\s]+)/gu; //#﹟＃ってかいてあるけど#だけでよくない？https://unicode.org/reports/tr31/#R8-1
export const hashtagRegex =
  /(?:^|\s)#(?<hashtag>[a-zA-Z\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}_+-][^#﹟＃\s]+)/gu;
export const npubRegex = /^npub\w{59}$/;
export const nipRegex = /NIP-([0-9]{2,})/g;

export const LUD06Regex = /^(LNURL1|lnurl1)[AC-HJ-NP-Z02-9]+$/;
export const LUD16Regex = /^[-_a-zA-Z0-9.]+@[-a-zA-Z0-9.]+$/;

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

export function formatAbsoluteDate(
  unixTime: number,
  full: boolean = false
): string {
  const date = new Date(unixTime * 1000);
  const now = new Date();

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

  return date.toLocaleString([], options);
}
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

export async function filesUpload(
  files: FileList,
  uploader: string,
  signal: AbortSignal // 新たに signal を受け取る
): Promise<FileUploadResponse[]> {
  console.log(files, uploader);
  let res: FileUploadResponse[] = [];
  for (const file of files) {
    try {
      const serverConfig = await readServerConfig(uploader);
      console.log(serverConfig);
      const header = await getToken(
        serverConfig.api_url,
        "POST",
        async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
        true
      );
      console.log(file);
      console.log(header);
      console.log(serverConfig.api_url);
      console.log(file.type);
      const response: FileUploadResponse = await uploadFile(
        file,
        serverConfig.api_url,
        header,
        { content_type: file.type },
        signal // signal を渡す
      );
      console.log(response);
      res.push(response);
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Upload aborted:", file.name);
        res.push({
          status: "error",
          message: "Upload aborted: " + file.name,
        } as FileUploadResponse);
      } else {
        console.error("Error uploading file:", error);
        res.push({
          status: "error",
          message: "Failed to upload file: " + file.name,
        } as FileUploadResponse);
      }
    }
  }
  return res;
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
  console.log(isFailed);
  if (isFailed.length > 0) {
    str += "Failed\n";
    isFailed.map((item) => (str += `${item}\n`));
  }
  return str;
};

export const convertMetaTags = (event: {
  tags: [string, string][];
  content: string;
}): string[] => {
  let newTag = ["imeta"];
  event.tags.map((tag) => {
    if (tag.length > 1 && tag[1].trim() !== "") {
      newTag.push(`${tag[0]} ${tag[1]}`);
    }
  });

  return newTag;
};

export const relayInfoFun = async (
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

  return httpsUrl.endsWith("/") ? httpsUrl : httpsUrl + "/";
}
export const initSettings: LumiSetting = {
  relays: [],
  useRelaySet: "0",
  pubkey: "",
  showPreview: true,
  defaultReaction: {
    content: "+",
    tag: [],
  },
  showImg: false,
  menuleft: false,
  showRelayIcon: false,
  // emoji: {
  //   list: [],
  //   updated: 0,
  //   event: undefined,
  // },
  // mute: {
  //   list: { p: [], word: [], t: [], e: [] },
  //   updated: 0,
  //   event: undefined,
  // },
  // mutebykinds: {
  //   list: [],
  //   updated: 0,
  // },
  showReactioninTL: true,
  nostrWalletConnect: "",
  showUserStatus: false,
  // showBanner: true,
  showKind16: false,
  addClientTag: false,
  showClientTag: true,
  showAllReactions: false,
};
export const initLumiEmoji: LumiEmoji = {
  list: [],
  updated: 0,
  event: undefined,
};
export const initLumiMute: LumiMute = {
  list: { p: [], word: [], t: [], e: [] },
  updated: 0,
  event: undefined,
};
export const initLumiMuteByKind: LumiMuteByKind = {
  list: [] as {
    kind: number;
    list: string[];
    event: Nostr.Event | undefined;
  }[],
  updated: 0,
};

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

//https://github.com/TsukemonoGit/NostViewstr/blob/3981eac66c5ec51afa38069a6981410b5a42bc16/src/lib/kind.ts
export const nostviewstrable = [
  3, 10000, 10001, 10002, 10003, 10004, 10005, 10006, 10007, 10015, 10030,
  10096, 10101, 10102, 30000, 30001, 30002, 30003, 30004, 30007,
  //30008, ばっじ
  30015, 30030,
];

export const nip19Decode = (
  content: string | undefined
):
  | { type: "naddr"; data: nip19.AddressPointer }
  | { type: "nevent"; data: nip19.EventPointer }
  | { type: "nprofile"; data: nip19.ProfilePointer }
  | { type: "nsec"; data: Uint8Array }
  | { type: "nrelay" | "npub" | "note"; data: string }
  | undefined => {
  if (content === undefined) {
    return undefined;
  }
  // console.log(content);
  try {
    const decoded: nip19.DecodeResult = nip19.decode(content);
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
export async function awaitInterval(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

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

//末尾に"/"をつける
export const normalizeRelayURL = (str: string) => {
  return !str.trim().endsWith("/") ? `${str.trim()}/` : str.trim();
};
