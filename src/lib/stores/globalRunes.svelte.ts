import { timelineFilterInit, type TimelineFilter } from "$lib/types";
import * as Nostr from "nostr-typedef";

export const displayEvents = createSlicedEvent();
//localstorage "timelineFilter"
export const timelineFilter = createTimelineFilter();

//-------------------------------------

// カスタムストアの作成関数
function createSlicedEvent() {
  let slicedEvent: Nostr.Event[] = $state([]);

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
