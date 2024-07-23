import type { QueryKey } from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";
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

export type RxReqBase = RxReq;

export type ReqStatus = "loading" | "success" | "error";

export interface ReqResult<A> {
  data: Readable<A | undefined>;
  status: Readable<ReqStatus>;
  error: Readable<Error>;
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
  rxNostr: RxNostr | undefined;

  filters: Nostr.Filter[];
  operator: OperatorFunction<EventPacket, A>;
  req?: RxReqBase;
  initData?: A;
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
}
declare global {
  interface Window {
    nostr?: Nostr.Nip07.Nostr;
  }
}

export interface LumiSetting {
  relays: DefaultRelayConfig[];
  useRelaySet: string;
  pubkey: string;
  showImg: boolean;
  showPreview: boolean;
  menuleft: boolean;
  showRelayIcon: boolean;
  showReactioninTL: boolean;
  showUserStatus: boolean;
  nostrWalletConnect: string;
  emoji: {
    list: string[][];
    updated: number; //最後に同期した日付
  };
  mute: {
    list: MuteList;
    updated: number; //最終同期日時};
  };
  mutebykinds: { list: { kind: number; list: string[] }[]; updated: number }; //{ list: { kind: number; list: string[] }[]; updated: number };
  defaultReaction: { content: string; tag: string[] };
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
}
export interface MargePostOptions {
  tags: string[][];
  kind?: number;
  content?: string;
  addableUserList?: string[];
  defaultUsers?: string[];
  warningText?: string | undefined;
}
