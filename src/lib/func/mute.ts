import { latest } from "rx-nostr";
import { usePromiseReq } from "./nostr";
import { pipe } from "rxjs";
import * as Nostr from "nostr-typedef";
import { mutes } from "$lib/stores/stores";
import { get } from "svelte/store";
import { lumiSetting } from "$lib/stores/globalRunes.svelte";

export async function refetchKind10000(): Promise<Nostr.Event | undefined> {
  const kind10000 = await usePromiseReq(
    {
      filters: [
        { kinds: [10000], authors: [lumiSetting.get().pubkey], limit: 1 },
      ],
      operator: pipe(latest()),
    },
    undefined,
    2000
  );

  if (
    kind10000.length > 0 &&
    (!get(mutes).event ||
      get(mutes).event?.pubkey !== kind10000[0].event.pubkey ||
      kind10000[0].event.created_at >= (get(mutes).event?.created_at ?? 0))
  ) {
    return kind10000[0].event;
  } else {
    return get(mutes).event;
  }
}
