import { latestEachNaddr, latestbyId, scanArray } from "$lib/stores/operators";
import { relaySearchRelays } from "$lib/stores/relays";
import { loginUser, queryClient } from "$lib/stores/stores";
import {
  setRelaysByKind10002,
  setRelaysByKind3,
} from "$lib/stores/useRelaySet";
import type { MuteList, Theme, ToastData } from "$lib/types";
import type { QueryKey } from "@tanstack/svelte-query";
import { nip04 } from "nostr-tools";
import type { Filter } from "nostr-typedef";
import * as Nostr from "nostr-typedef";
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
          subscription.unsubscribe();
          rxNostr.dispose();
          resolve();
        },
      });

    rxReq.emit([
      //   { authors: [pubkey], kinds: [3], limit: 1 },
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
    }, 4000); //completeOnTimeoutでおわらないことないとおもうけどいちおう

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
          subscription.unsubscribe();
          rxNostr.dispose();
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
  // const kind3 = data.find((packet) => packet.event.kind === 3);

  const relays =
    kind10002 !== undefined
      ? setRelaysByKind10002(kind10002.event)
      : //    : kind3 !== undefined
        //    ? setRelaysByKind3(kind3.event)
        [];

  return relays;
}

export async function toMuteList(event: Nostr.Event): Promise<MuteList> {
  let tags: string[][] = [];
  const muteList: MuteList = {
    p: [],
    word: [],
    t: [],
    e: [],
  };
  try {
    const privateContent = await (
      window?.nostr as Nostr.Nip07.Nostr
    )?.nip04?.decrypt(get(loginUser), event.content);
    if (privateContent) {
      const parsedContent: string[][] = JSON.parse(privateContent);
      if (parsedContent.length > 0) {
        tags = parsedContent;
      }
    }
  } catch (error) {
    console.log("failed to decrypt");
  }
  tags = [...tags, ...event.tags];
  tags.forEach(([tag, content]) => {
    if (tag === "p" || tag === "t" || tag === "word" || tag === "e") {
      muteList[tag].push(content);
    }
  });
  return muteList;
}

export async function getNaddrEmojiList(
  filters: Filter[],
  relays: DefaultRelayConfig[]
): Promise<EventPacket[]> {
  const rxNostr = createRxNostr();
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relays);

  const event = await new Promise<EventPacket[]>((resolve) => {
    let res: EventPacket[];

    const subscription = rxNostr
      .use(rxReq)
      .pipe(
        verify(),
        uniq(),
        latestEachNaddr(),
        scanArray(),
        completeOnTimeout(3000)
      )
      .subscribe({
        next: (packet) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          subscription.unsubscribe();
          rxNostr.dispose();
          resolve(res);
        },
      });

    rxReq.emit(filters);
  });

  console.log("kekka", event);
  return event;
}

export async function getMutebykindList(
  filters: Filter[],
  relays: DefaultRelayConfig[]
): Promise<EventPacket[]> {
  const rxNostr = createRxNostr();
  const rxReq = createRxBackwardReq();
  rxNostr.setDefaultRelays(relays);

  const event = await new Promise<EventPacket[]>((resolve) => {
    let res: EventPacket[];
    setTimeout(() => {
      subscription.unsubscribe();
      rxNostr.dispose();
      resolve(res);
    }, 4000); //completeOnTimeoutでおわらないことないとおもうけどいちおう

    const subscription = rxNostr
      .use(rxReq)
      .pipe(verify(), uniq(), latestbyId(), completeOnTimeout(2000))
      .subscribe({
        next: (packet) => {
          console.log("Received:", packet);
          res = packet;
        },
        complete: () => {
          console.log("Completed!");
          subscription.unsubscribe();
          rxNostr.dispose();
          resolve(res);
        },
      });

    rxReq.emit(filters);
  });

  console.log("kekka", event);
  return event;
}

//pachet[]をmutebykindのほぞんのかたちにする
export async function getMuteByList(
  packets: EventPacket[]
): Promise<{ kind: number; list: string[] }[]> {
  const muteByList: { kind: number; list: string[] }[] = [];

  for (const packet of packets) {
    const kind = Number(
      packet.event.tags.filter((tag) => tag[0] === "d").map((tag) => tag[1])
    );
    if (kind) {
      let pTags = packet.event.tags
        .filter((tag) => tag[0] === "p")
        .map((tag) => tag[1]);

      if (packet.event.content.length > 0) {
        const privateTags = await decryptContent(packet.event);
        if (privateTags && privateTags.length > 0) {
          const ppTags = privateTags
            .filter((tag: string[]) => tag[0] === "p")
            .map((tag: string[]) => tag[1]);
          if (ppTags.length > 0) {
            pTags = [...pTags, ...ppTags];
          }
        }
      }

      if (pTags.length > 0) {
        const existingKind = muteByList.findIndex((item) => item.kind === kind);
        if (existingKind !== -1) {
          muteByList[existingKind].list.push(...pTags);
        } else {
          muteByList.push({ kind, list: pTags });
        }
      }
    }
  }
  return muteByList;
}

async function decryptContent(event: Nostr.Event): Promise<string[][] | null> {
  try {
    const privateTagsJson = await (
      window?.nostr as Nostr.Nip07.Nostr
    )?.nip04?.decrypt(event.pubkey, event.content);
    return privateTagsJson ? JSON.parse(privateTagsJson) : null;
  } catch (error) {
    console.error("Failed to decrypt content:", error);
    return null;
  }
}
