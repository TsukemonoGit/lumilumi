import type { LumiSetting, Profile } from "$lib/types";
import * as Nostr from "nostr-typedef";
import { readServerConfig, type FileUploadResponse } from "nostr-tools/nip96";
import { getToken } from "nostr-tools/nip98";
import { uploadFile } from "./upload";
import { Nip11Registry, type EventPacket } from "rx-nostr";
import type { Nip11 } from "nostr-typedef";
import { binarySearch } from "nostr-tools/utils";
import type { nip19 } from "nostr-tools";
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
//https://api.nostr.watch/v1/nip/50
export const relayRegex = /^wss?:\/\/\S+$/g;
//export const nip33RegexG = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/g;
export const nip33Regex = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/;
export const nip19Regex =
  /nostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,})|(nrelay1[023456789acdefghjklmnpqrstuvwxyz]{20,}))/g;

export const urlRegex = /(https?:\/\/+[^\s"'<`\]]+[^\s"'<`:\].]+)/g;
export const emojiRegex = /(:[^:\s]+:)/g;
export const emojiShortcodeRegex = /^[a-zA-Z0-9_]+$/;
//export const hashtagRegex = /(?<=^|\s)#(?<hashtag>[\p{Letter}\p{Number}_]+)/gu; //(?<hashtag>...) は、名前付きキャプチャグループ
export const hashtagRegex =
  /(?<=^|\s)#(?<hashtag>[a-zA-Z\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}_+-][^#﹟＃\s]+)/gu; //#﹟＃ってかいてあるけど#だけでよくない？https://unicode.org/reports/tr31/#R8-1
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

export const generateResultMessage = (isSuccess: any[], isFailed: any[]) => {
  let str = "";
  if (isSuccess.length > 0) {
    str = "OK\n";
    isSuccess.map((item) => (str += `${item.from}\n`));
    str += "\n";
  }
  if (isFailed.length > 0) {
    str += "Failed\n";
    isFailed.map((item) => `${item.from}\n`);
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
  showPreview: false,
  defaultReaction: {
    content: "+",
    tag: [],
  },
  showImg: false,
  menuleft: false,
  showRelayIcon: false,
  emoji: {
    list: [],
    updated: 0,
  },
  mute: {
    list: { p: [], word: [], t: [], e: [] },
    updated: 0,
  },
  mutebykinds: {
    list: [],
    updated: 0,
  },
  showReactioninTL: true,
  nostrWalletConnect: "",
  showUserStatus: false,
  noBanner: false,
  showKind16: false,
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

export const eventKinds = new Map<number, { ja: string; en: string }>([
  [
    0,
    {
      ja: "メタデータ",
      en: "Metadata",
    },
  ],
  [
    1,
    {
      ja: "テキストノート",
      en: "Short Text Note",
    },
  ],
  //
  [
    3,
    {
      ja: "フォローリスト",
      en: "Follows",
    },
  ],
  [
    4,
    {
      ja: "暗号化されたダイレクトメッセージ",
      en: "Encrypted Direct Messages",
    },
  ],
  [
    5,
    {
      ja: "イベント削除リクエスト",
      en: "Event Deletion Request",
    },
  ],
  [
    6,
    {
      ja: "リポスト",
      en: "Repost",
    },
  ],
  [
    7,
    {
      ja: "リアクション",
      en: "Reaction",
    },
  ],
  [
    8,
    {
      ja: "バッジ アワード",
      en: "Badge Award",
    },
  ],
  [
    9,
    {
      ja: "グループチャットメッセージ",
      en: "Group Chat Message",
    },
  ],
  [
    10,
    {
      ja: "グループチャット スレッド返信",
      en: "Group Chat Threaded Reply",
    },
  ],
  [
    11,
    {
      ja: "グループスレッド",
      en: "Group Thread",
    },
  ],
  [
    12,
    {
      ja: "グループスレッド返信",
      en: "Group Thread Reply",
    },
  ],
  [
    13,
    {
      ja: "シール",
      en: "Seal",
    },
  ],
  [
    14,
    {
      ja: "ダイレクト・メッセージ",
      en: "Direct Message",
    },
  ],
  //
  [
    16,
    {
      ja: "汎用リポスト",
      en: "Generic Repost",
    },
  ],
  [
    17,
    {
      ja: "ウェブサイトへの反応",
      en: "Reaction to a website",
    },
  ],
  //

  [
    40,
    {
      ja: "チャンネル作成",
      en: "Channel Creation",
    },
  ],
  [
    41,
    {
      ja: "チャンネルのメタデータ",
      en: "Channel Metadata",
    },
  ],
  [
    42,
    {
      ja: "チャンネルメッセージ",
      en: "	Channel Message",
    },
  ],
  [
    43,
    {
      ja: "チャンネル非表示メッセージ",
      en: "	Channel Hide Message",
    },
  ],
  [
    44,
    {
      ja: "チャンネルミュートユーザー",
      en: "Channel Mute User",
    },
  ],
  //

  [
    64,
    {
      ja: "チェス",
      en: "Chess (PGN)",
    },
  ],
  //

  [
    818,
    {
      ja: "リクエストのマージ",
      en: "Merge Requests",
    },
  ],
  //

  [
    1021,
    {
      ja: "入札",
      en: "Bid",
    },
  ],
  [
    1022,
    {
      ja: "入札確認",
      en: "Bid confirmation",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    9735,
    {
      ja: "Zap",
      en: "Zap",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    10000,
    {
      ja: "ミュートリスト",
      en: "Mute list",
    },
  ],
  [
    10001,
    {
      ja: "ピンリスト",
      en: "Pin list",
    },
  ],
  [
    10002,
    {
      ja: "リレーリストのメタデータ",
      en: "Relay List Metadata",
    },
  ],
  [
    10003,
    {
      ja: "ブックマークリスト",
      en: "Bookmark list",
    },
  ],
  [
    10004,
    {
      ja: "コミュニティリスト",
      en: "Communities list",
    },
  ],
  [
    10005,
    {
      ja: "パブリックチャットリスト",
      en: "Public chats list",
    },
  ],
  [
    10006,
    {
      ja: "ブロックリレーリスト",
      en: "Blocked relays list",
    },
  ],
  [
    10007,
    {
      ja: "検索リレーリスト",
      en: "Search relays list",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    10030,
    {
      ja: "絵文字リスト",
      en: "User emoji list",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    30000,
    {
      ja: "ユーザーリストセット",
      en: "Follow sets",
    },
  ],
  [
    30001,
    {
      ja: "汎用リストセット",
      en: "Generic lists",
    },
  ],
  [
    30002,
    {
      ja: "リレーリストセット",
      en: "Relay sets",
    },
  ],
  [
    30003,
    {
      ja: "ブックマークリストセット",
      en: "Bookmark sets",
    },
  ],
  [
    30004,
    {
      ja: "記事のキュレーションセット",
      en: "Article Curation Sets",
    },
  ],
  [
    30005,
    {
      ja: "ビデオのキュレーションセット",
      en: "Video Curation Sets",
    },
  ],
  //
  [
    30007,
    {
      ja: "Kind別ミュートセット",
      en: "Kind mute sets",
    },
  ],
  //
  //んあ～～～～～～
  //

  [
    30023,
    {
      ja: "記事",
      en: "	Long-form Content",
    },
  ],
  [
    30024,
    {
      ja: "記事の草稿",
      en: "Draft Long-form Content",
    },
  ],
  //

  [
    30030,
    {
      ja: "絵文字セット",
      en: "Emoji sets",
    },
  ],

  [
    30315,
    {
      ja: "ユーザーステータス",
      en: "User Statuses",
    },
  ],
  //

  //
  //

  [
    31990,
    {
      ja: "アプリ情報",
      en: "Handler information",
    },
  ],
]);
/*

[
  ,
  {
    ja: "",
    en: "",
  },
],
*/

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
  10096, 10101, 10102, 30000, 30001, 30002, 30003, 30004, 30007, 30008, 30015,
  30030,
];
