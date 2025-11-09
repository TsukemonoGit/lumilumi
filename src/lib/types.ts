import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  AcceptableDefaultRelaysConfig,
  DefaultRelayConfig,
  EventPacket,
  RxNostr,
  RxReq,
  RxReqEmittable,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import type { OperatorFunction } from "rxjs";
import type { Readable } from "svelte/store";

export interface MenuGroup {
  label?: string;
  items: MenuItem[];
}
export interface MenuItem {
  icon: any;
  text: string;
  action: string;
}
export type RxReqBase = RxReq;

export type ReqStatus = "loading" | "success" | "error";

export type OldTimelineFilter = {
  adaptMute: boolean;
  selectCanversation: number;
  excludeFollowee: boolean; // ← globalがない
};

export interface TimelineFilter {
  adaptMute: boolean;
  selectCanversation: number;
  global: {
    excludeFollowee: boolean;
    excludeConversation: boolean;
  };
}

export const timelineFilterInit: TimelineFilter = {
  adaptMute: true,
  selectCanversation: 0,
  global: {
    excludeFollowee: false,
    excludeConversation: false,
  },
};

export interface ReqResult<A> {
  data: Readable<A | undefined | null>;
  status: Readable<ReqStatus>;
  error: Readable<Error | null>;
}

export interface UseConnectionsOpts {
  rxNostr: RxNostr;
  relays: AcceptableDefaultRelaysConfig[];
}

export interface UseReqOpts<A> {
  queryKey: QueryKey;
  filters: Nostr.Filter[];
  operator: OperatorFunction<EventPacket, A>;
  req?:
    | RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable;

  initData?: A;
}
export interface UseForwardReqOpts<A> {
  queryKey: QueryKey;
  filters: Nostr.Filter[];
  operator: OperatorFunction<EventPacket, A>;
  req: RxReq<"forward"> & RxReqEmittable & RxReqPipeable;

  initData?: A;
}
export interface UsePromiseReqOpts<A> {
  filters: Nostr.Filter[];
  operator: OperatorFunction<EventPacket, A>;
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable);

  initData?: A;
}
export interface UseReqOpts2<A> {
  rxNostr: RxNostr;
  queryKey: QueryKey;
  filters: Nostr.Filter[];
  operator: OperatorFunction<EventPacket, A>;
  req?: RxReqBase;
  initData?: A;
}
export interface UseReqOpts3<A> {
  operator: OperatorFunction<EventPacket, A>;
}
export type Theme = "light" | "dark" | "system";
export type ToastData = {
  title: string;
  description: string;
  color: string;
};

export interface Profile {
  [key: string]: any;
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  display_name?: string;
  website?: string;
  banner?: string;
  bot?: boolean;
  lud16?: string;
  lud06?: string;
  birth?: number[]; //[day, month, year(optional)]//旧
  birthday?: { year?: number; month?: number; day?: number };
}
declare global {
  interface Window {
    nostr?: Nostr.Nip07.Nostr;
  }
}
export type ImageAutoExpand = "all" | "following" | "manual";

export interface LumiSetting {
  relays: DefaultRelayConfig[];
  useRelaySet: string;
  pubkey: string;
  showImg: boolean;
  picQuarity: number;
  embed: boolean;
  showPreview: boolean;
  menuleft: boolean;
  showRelayIcon: boolean;
  showReactioninTL: boolean;
  showUserStatus: boolean;
  showKind16: boolean;
  showAllReactions: boolean;
  kind42inTL: boolean;
  addClientTag: boolean;
  imageAutoExpand: ImageAutoExpand; //画像表示のワンクッションあり
  defaultReaction: { content: string; tag: string[] };
  protectedEvents: boolean; //NIP-70
}
export interface LumiEmoji {
  list: string[][];
  updated: number; //最後に同期した日付
  event: Nostr.Event | undefined;
}
export interface LumiMute {
  list: MuteList;
  updated: number; //最終同期日時};
  event: Nostr.Event | undefined;
}
export interface LumiMuteByKind {
  list: LumiMuteByKindList[];
  updated: number;
}

export interface LumiMuteByKindList {
  kind: number;
  list: string[];
  event: Nostr.Event | undefined;
}
export interface MuteList {
  p: string[];
  word: string[];
  t: string[];
  e: string[];
}
export const mutetags = ["p", "t", "word", "e"];

export interface ChannelData {
  name: string;
  about?: string;
  picture?: string;
  relays?: string;
  kategories?: string[];
}

export interface DefaultPostOptions {
  tags: string[][];
  kind?: number;
  content?: string;
}

//リプライとかクオテとかの文中にnostr:~~をいれておくとか、リプユーザーを追加とか削除とか
//kindはどちらももとのkindのまま
export interface AdditionalPostOptions {
  tags: string[][];
  content: string;
  addableUserList: string[];
  defaultUsers: string[];
  warningText: string | undefined;
  kind?: number | undefined;
}
export interface MargePostOptions {
  tags: string[][];
  kind: number;
  content?: string;
  addableUserList?: string[];
  defaultUsers?: string[];
  warningText?: string | undefined;
}
export interface UseQueryOpt {
  staleTime: number;
  gcTime: number;
  initialDataUpdatedAt: number | undefined;
  refetchInterval: number;
}

export interface UserMuteStatus {
  user: boolean;
  repost: boolean;
  reaction: boolean;
  zap: boolean;
}

export interface DecodedGeohash {
  latitude: number;
  longitude: number;
}

export interface LumiSettingBase {
  lumiSetting: LumiSetting;
  showBanner: boolean;
  theme: string;
  colorScheme: string;
  timelineFilter: TimelineFilter;
  uploader: UploaderOption | string;
  globalRegexFilter: string;
}

export interface Kind30078LumiSetting extends LumiSettingBase {
  name: string;
  created_at: number;
}

export interface Kind30078LumiSettingObj extends LumiSettingBase {}

export type UploaderType = "nip96" | "blossom";
export interface UploaderOption {
  type: UploaderType;
  address: string;
}
