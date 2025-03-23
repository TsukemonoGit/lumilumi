import type {
  LumiSetting,
  LumiEmoji,
  LumiMute,
  LumiMuteByKind,
} from "$lib/types";
import * as Nostr from "nostr-typedef";

export const notificationKinds = [
  1, // Note
  4, // Direct message (legacy)
  6, // Repost
  7, // Reaction
  8, // badge award event
  16, // Generic repost
  42, // Channel message
  9735, // Zap receipt
  1111, // Comment (NIP-22)
  1059, // Direct message (newer format)  三代目DM ,
];
export const clientTag = [
  "client",
  "lumilumi",
  "31990:84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5:1727506446612",
  "wss://relay.nostr.band",
];
export const monoZap = {
  //https://${domain}/.well-known/lnurlp/${name} の callback の部分
  //
  endoiunt:
    "https://livingroomofsatoshi.com/api/v1/lnurl/payreq/60920800-8f5c-4bcf-887c-789c24bd3f73",

  relays: [
    "wss://nostr.mutinywallet.com",
    "wss://bostr.nokotaro.com",
    "wss://relay.nostr.band/",
    "wss://relay.nostr.wirednet.jp",
  ],
  pubkey: "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5",
  eventTag: [
    "a",
    "31990:84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5:1727506446612",
  ],
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

export const initSettings: LumiSetting = {
  relays: [],
  useRelaySet: "0",
  pubkey: "",
  showPreview: true,
  defaultReaction: {
    content: "+",
    tag: [],
  },
  picQuarity: 100,
  showImg: false,
  embed: true,
  menuleft: false,
  showRelayIcon: false,

  showReactioninTL: true,

  showUserStatus: false,

  showKind16: false,
  addClientTag: false,
  showAllReactions: false,
  kind42inTL: false,
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

//https://github.com/TsukemonoGit/NostViewstr/blob/3981eac66c5ec51afa38069a6981410b5a42bc16/src/lib/kind.ts
export const nostviewstrable = [
  3, 10000, 10001, 10002, 10003, 10004, 10005, 10006, 10007, 10015, 10030,
  10096, 10101, 10102, 30000, 30001, 30002, 30003, 30004, 30007,
  //30008, ばっじ
  30015, 30030,
];
