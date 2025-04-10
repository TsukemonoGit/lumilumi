import { initSettings } from "$lib/func/constants";
import {
  timelineFilterInit,
  type LumiSetting,
  type TimelineFilter,
} from "$lib/types";
import * as Nostr from "nostr-typedef";
import type { ConnectionState } from "rx-nostr";
import type { EventVerifier } from "rx-nostr-crypto";
import { SvelteMap } from "svelte/reactivity";

export const displayEvents = createCustomStore<Nostr.Event[]>([]);
export const timelineFilter =
  createCustomStore<TimelineFilter>(timelineFilterInit);
export const followList = createCustomStore<Map<string, string | undefined>>(
  new Map()
);
export const relayStateMap = createCustomStore<
  SvelteMap<string, ConnectionState>
>(new SvelteMap());
export const userStatusMap = createCustomStore<
  SvelteMap<string, SvelteMap<string, Nostr.Event>>
>(new SvelteMap());
export const viewEventIds = createCustomStore<string[][]>([]);
export const lumiSetting = createCustomStore<LumiSetting>(initSettings);
export const showBanner = createShowBanner();
export const verifier = createCustomStore<EventVerifier | undefined>(undefined);

export const authRelay = createCustomStore<string[]>([]);

//-------------------------------------

// 汎用的なカスタムストア作成関数
function createCustomStore<T>(initialValue: T) {
  let state: T = $state.raw(initialValue);
  let subscribers: Array<(value: T) => void> = [];

  return {
    get: () => state,
    set: (value: T) => {
      state = value;
      subscribers.forEach((subscriber) => subscriber(state));
    },
    update: (updater: (current: T) => T) => {
      state = updater(state);
      subscribers.forEach((subscriber) => subscriber(state));
    },
    subscribe: (subscriber: (value: T) => void) => {
      subscribers.push(subscriber);
      subscriber(state); // 初回呼び出し
      return () => {
        subscribers = subscribers.filter((s) => s !== subscriber);
      };
    },
  };
}

function createShowBanner() {
  let _showBanner: boolean = $state(true);
  let nlBanner: HTMLElement | null;

  return {
    setBanner: (banner: HTMLElement) => {
      nlBanner = banner;
    },
    get: () => _showBanner,
    set: (value: boolean) => {
      _showBanner = value;
      if (!nlBanner) {
        nlBanner = document.getElementsByTagName(
          "nl-banner"
        )?.[0] as HTMLElement | null;
      }
      if (nlBanner) {
        nlBanner.style.display = _showBanner ? "" : "none";
      }
    },
    update: (updater: (current: boolean) => boolean) => {
      _showBanner = updater(_showBanner);
    },
  };
}
