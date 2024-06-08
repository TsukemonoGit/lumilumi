import type { QueryKey } from "@tanstack/svelte-query";
import type Nostr from "nostr-typedef";
import type {
  AcceptableDefaultRelaysConfig,
  DefaultRelayConfig,
  EventPacket,
  RxNostr,
  RxReq,
  RxReqController,
} from "rx-nostr";
import type { OperatorFunction } from "rxjs";
import type { Readable } from "svelte/store";

export type RxReqBase = RxReq & RxReqController;

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
  name?: string;
  display_name?: string;
}
declare global {
  interface Window {
    nostr?: Nostr.Nip07.Nostr;
  }
}
