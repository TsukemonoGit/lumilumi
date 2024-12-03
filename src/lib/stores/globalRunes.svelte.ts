import { timelineFilterInit, type TimelineFilter } from "$lib/types";
import * as Nostr from "nostr-typedef";
import { SvelteMap } from "svelte/reactivity";

export const displayEvents = createSlicedEvent();
//localstorage "timelineFilter"
export const timelineFilter = createTimelineFilter();
export const followList = createFollowList();
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

// export const followList: Writable<Map<string, string | undefined>> = writable<
//   Map<string, string | undefined>
// >(new Map());
