import { scanArray } from "$lib/stores/operators";
import { relaySearchRelays } from "$lib/stores/relays";
import { queryClient } from "$lib/stores/stores";
import {
  setRelaysByKind10002,
  setRelaysByKind3,
} from "$lib/stores/useRelaySet";
import type { Theme, ToastData } from "$lib/types";
import type { QueryKey } from "@tanstack/svelte-query";
import type { Filter } from "nostr-typedef";

import {
  completeOnTimeout,
  createRxBackwardReq,
  createRxNostr,
  latest,
  uniq,
  verify,
  type DefaultRelayConfig,
  type EventPacket,
} from "rx-nostr";
import { get } from "svelte/store";

export function setTheme(theme: Theme) {
  if (
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export async function getRelayList(pubkey: string): Promise<EventPacket[]> {
  const rxNostr = createRxNostr();
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relaySearchRelays);
  let res: EventPacket[] = [];
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      subscription.unsubscribe();
      rxNostr.dispose();
      resolve();
    }, 3000);
    const subscription = rxNostr
      .use(rxReq)
      .pipe(verify(), uniq(), scanArray(), completeOnTimeout(2000))
      .subscribe({
        next: (packet) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          resolve();
        },
      });

    rxReq.emit([
      { authors: [pubkey], kinds: [3], limit: 1 },
      { authors: [pubkey], kinds: [10002], limit: 1 },
    ]);
  });

  console.log("kekka", res);
  return res;
}

export async function getDoukiList(
  filters: Filter[],
  relays: DefaultRelayConfig[]
): Promise<EventPacket> {
  const rxNostr = createRxNostr();
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relays);

  const event = await new Promise<EventPacket>((resolve) => {
    let res: EventPacket;
    setTimeout(() => {
      subscription.unsubscribe();
      rxNostr.dispose();
      resolve(res);
    }, 3000);

    const subscription = rxNostr
      .use(rxReq)
      .pipe(verify(), uniq(), latest(), completeOnTimeout(2000))
      .subscribe({
        next: (packet) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          resolve(res);
        },
      });

    rxReq.emit(filters);
  });

  console.log("kekka", event);
  return event;
}

export async function getQueryRelays(pubkey: string) {
  let defaultRelayData = get(queryClient)?.getQueryData([
    "defaultRelay",
    pubkey,
  ] as QueryKey);
  console.log(defaultRelayData);

  if (!defaultRelayData) {
    console.log("t");
    const relayList = await getRelayList(pubkey);
    console.log(relayList);
    if (relayList.length > 0) {
      get(queryClient).setQueryData(["defaultRelay", pubkey], relayList);
    } else {
      console.log("failed to get relay data");
      return;
    }
  }
  defaultRelayData = get(queryClient)?.getQueryData([
    "defaultRelay",
    pubkey,
  ] as QueryKey);
  console.log(defaultRelayData);

  if (!defaultRelayData) {
    return;
  }
  const data: EventPacket[] = defaultRelayData as EventPacket[];

  const kind10002 = data.find((packet) => packet.event.kind === 10002);
  const kind3 = data.find((packet) => packet.event.kind === 3);

  const relays =
    kind10002 !== undefined
      ? setRelaysByKind10002(kind10002.event)
      : kind3 !== undefined
      ? setRelaysByKind3(kind3.event)
      : [];

  return relays;
}
