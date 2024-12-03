import * as Nostr from "nostr-typedef";

export const displayEvents = createSlicedEvent();
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
