// timelineList.ts

import { usePromiseReq } from "$lib/func/nostr";
import { scanArray } from "$lib/stores/operators";
import type { QueryKey } from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";
import { createRxBackwardReq, uniq, type EventPacket } from "rx-nostr";
import { pipe, type OperatorFunction } from "rxjs";
//import * as Nostr from "nostr-typedef";
import { get } from "svelte/store";
import { slicedEvent } from "$lib/stores/stores";

export async function loadOlderEvents(
  sift: number,
  filters: Filter[],

  // lastfavcheck: boolean,
  until: number,
  tie: OperatorFunction<
    EventPacket,
    EventPacket & {
      seenOn: Set<string>;
      isNew: boolean;
    }
  >,
  relays: string[] | undefined
): Promise<EventPacket[]> {
  //console.log(get(slicedEvent));
  if (!get(slicedEvent) || get(slicedEvent).length < 0) {
    console.log("sliced eventがないから古いイベントトルの失敗");
    return [];
  }

  // const notReactionEvent = get(slicedEvent).filter(
  //   (item) =>
  //     item.pubkey !== get(loginUser) ||
  //     !item.tags.find((tag) => tag[0] === "p" && tag[1] === get(loginUser))
  // );
  // console.log(notReactionEvent);
  // if (data && data.length > 1) {
  //   const kind1 = data.filter(
  //     (item) =>
  //       item.event.kind === 1 &&
  //       !item.event.tags.find(
  //         (tag) => tag[0] === "p" && tag[1] === get(loginUser)
  //       )
  //   ); //通知こないたいぷのkind1の最後
  // console.log(kind1.length);
  //   console.log(kind1[kind1.length - 1]);
  // if (lastfavcheck && kind1.length === 0) {
  //   return [];
  // }
  // const lastEvent = get(slicedEvent)[get(slicedEvent).length - 1];
  // console.log(lastEvent);
  // const untilTimestamp = lastEvent.created_at;
  // console.log(untilTimestamp);
  //最後がkind1だったらほかのkind6とかは間に入ってるってことだからkind6とかも合わせて取得
  //filterごとにlimitついてるから、filtersじゃなくてfilterごとに数取ってsliceシテってしないといけない。
  //けどなんか大変そうだから最初のフィルターだけにしよう
  const newFilters = filters.map((filter) => {
    return {
      ...filter,
      limit: sift + 1,
      until: until,
      since: undefined,
    };
  });
  console.log(newFilters);
  const newReq = createRxBackwardReq();
  const operator = pipe(tie, uniq(), scanArray());
  const olderEvents = await usePromiseReq(
    {
      operator: operator,

      filters: newFilters,
      req: newReq,
    },
    relays
  );
  //console.log(olderEvents);
  //新しいのからsift分だけもらう（飛び飛びのイベントとかで古いのが取得されてそれ採用するとあいだのイベントが抜けるから）

  console.log("sift", sift);
  console.log("olderEvents", olderEvents.length);
  return olderEvents.slice(0, sift);
}

export async function firstLoadOlderEvents(
  sift: number,
  filters: Filter[],
  tie: OperatorFunction<
    EventPacket,
    EventPacket & {
      seenOn: Set<string>;
      isNew: boolean;
    }
  >,
  relays: string[] | undefined
): Promise<EventPacket[]> {
  //filterごとにlimitついてるから、filtersじゃなくてfilterごとに数取ってsliceシテってしないといけない。
  const newReq = createRxBackwardReq();
  const operator = pipe(tie, uniq(), scanArray());
  const olderEvents = await usePromiseReq(
    {
      operator: operator,
      filters: filters,
      req: newReq,
    },
    relays,
    4000
  );
  //新しいのからsift分だけもらう（飛び飛びのイベントとかで古いのが取得されてそれ採用するとあいだのイベントが抜けるから）
  //↑これoperator通したときに通さないやつとかいたら飛び飛びの古いのまで取得することになるから省かないようにしたデータからシフト分だけ取らないと
  console.log("sift", sift);
  console.log("olderEvents.length", olderEvents.length);
  return olderEvents.slice(0, sift === 0 ? undefined : sift);
}

export async function waitForConnections(
  readUrls: string[],
  relayStateMap: Map<string, string>,
  maxWaitTime: number
) {
  const normalizeUrl = (url: string) => url.replace(/\/$/, ""); // Function to remove trailing slash
  const normalizedReadUrls = readUrls.map(normalizeUrl); // Normalize all URLs in readUrls

  const startTime = Date.now();

  // Function to check how many relays are not in 'initialize' or 'connecting' state
  const countFinalStateRelays = () => {
    return normalizedReadUrls.filter((url) => {
      const state = relayStateMap.get(normalizeUrl(url));
      return state !== "initialize" && state !== "connecting";
    }).length;
  };

  // Wait until all relays are in a final state or maxWaitTime is exceeded
  while (true) {
    const finalStateCount = countFinalStateRelays();
    const totalRelays = normalizedReadUrls.length;

    console.log(`Progress: ${finalStateCount} out of ${totalRelays} relays`);

    if (finalStateCount === totalRelays) {
      console.log("All relays are in a final state. Proceeding...");
      break;
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= maxWaitTime) {
      console.log("Maximum wait time exceeded. Proceeding...");
      break;
    }

    //console.log("Waiting for all relays to reach a final state...");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 500ms before checking again
  }
}
