import type {
  LumiSetting,
  LumiEmoji,
  LumiMute,
  LumiMuteByKind,
} from "$lib/types";
import * as Nostr from "nostr-typedef";

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
