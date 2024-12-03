import { timelineFilterInit, type TimelineFilter } from "$lib/types";
import * as Nostr from "nostr-typedef";
import type { ConnectionState } from "rx-nostr";
import { SvelteMap } from "svelte/reactivity";

export const displayEvents = createSlicedEvent();
//localstorage "timelineFilter"
export const timelineFilter = createTimelineFilter();
export const followList = createFollowList();
export const relayStateMap = createRelayStateMap();
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
  let _relayStates: SvelteMap<string, ConnectionState> = $state.raw(
    new SvelteMap()
  );

  return {
    get get() {
      return _relayStates;
    },
    set: (states: SvelteMap<string, ConnectionState>) => {
      _relayStates = states;
    },
  };
}
