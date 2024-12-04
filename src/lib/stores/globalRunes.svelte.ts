import { timelineFilterInit, type TimelineFilter } from "$lib/types";
import * as Nostr from "nostr-typedef";
import type { ConnectionState } from "rx-nostr";
import { SvelteMap } from "svelte/reactivity";

export const displayEvents = createSlicedEvent();
//localstorage "timelineFilter"
export const timelineFilter = createTimelineFilter();
export const followList = createFollowList();
export const relayStateMap = createRelayStateMap();
export const userStatusMap = createUserStatusMap();
export const viewEventIds = createViewEventIds();

//-------------------------------------

// カスタムストアの作成関数
function createSlicedEvent() {
  let slicedEvent: Nostr.Event[] = $state.raw([]);

  return {
    get get() {
      return slicedEvent;
    },

    set: (evs: Nostr.Event[]) => (slicedEvent = evs),
  };
}

// カスタムストアの作成関数
function createTimelineFilter() {
  let _timelineFilter: TimelineFilter = $state(timelineFilterInit);

  return {
    get get() {
      return _timelineFilter;
    },

    set: (evs: TimelineFilter) => (_timelineFilter = evs),
  };
}

function createFollowList() {
  let _followList: SvelteMap<string, string | undefined> = $state.raw(
    new SvelteMap()
  );
  return {
    get get() {
      return _followList;
    },
    set: (list: SvelteMap<string, string | undefined>) => {
      _followList = list;
    },
  };
}

function createRelayStateMap() {
  let _relayStatus: SvelteMap<string, ConnectionState> = $state.raw(
    new SvelteMap()
  );

  return {
    get get() {
      return _relayStatus;
    }, // 現在の値を基に新しい値を生成する
    update: (
      updater: (
        current: SvelteMap<string, ConnectionState>
      ) => SvelteMap<string, ConnectionState>
    ) => {
      _relayStatus = updater(_relayStatus);
    },
    set: (status: SvelteMap<string, ConnectionState>) => {
      _relayStatus = status;
    },
  };
}

function createUserStatusMap() {
  let _userStatusMap: SvelteMap<
    string,
    SvelteMap<string, Nostr.Event>
  > = $state(new SvelteMap());

  return {
    get get() {
      return _userStatusMap;
    },
    update: (
      updater: (
        current: SvelteMap<string, SvelteMap<string, Nostr.Event>>
      ) => SvelteMap<string, SvelteMap<string, Nostr.Event>>
    ) => {
      _userStatusMap = updater(_userStatusMap);
    },
    // 新しい値を直接設定する
    set: (status: SvelteMap<string, SvelteMap<string, Nostr.Event>>) => {
      _userStatusMap = status;
    },
  };
}

function createViewEventIds() {
  let _viewEventIds: string[][] = $state([]);

  return {
    get get() {
      return _viewEventIds;
    },
    update: (updater: (current: string[][]) => string[][]) => {
      _viewEventIds = updater(_viewEventIds);
    },
    // 新しい値を直接設定する
    set: (ids: string[][]) => {
      _viewEventIds = ids;
      // console.log(_viewEventIds.length);
    },
  };
}