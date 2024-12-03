import type { QueryKey } from "@tanstack/svelte-query";
import {
  latest,
  uniq,
  type DefaultRelayConfig,
  type EventPacket,
  type RxReq,
  type RxReqEmittable,
  type RxReqOverable,
  type RxReqPipeable,
} from "rx-nostr";
import type { Filter } from "nostr-typedef";
import type { Event } from "nostr-typedef";
import { pipe } from "rxjs";
import { derived, get } from "svelte/store";
import { setRelays } from "$lib/func/nostr";
import { relaySearchRelays } from "./relays";
import { app } from "./stores";
import { useReq } from "$lib/func/useReq";
import type { ReqResult } from "$lib/types";

//今設定されてるdefaultRelayConfigのreadだけ30002で上書きする
export function useGlobalRelaySet(
  queryKey: QueryKey,
  filters: Filter[],
  req?:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined
): ReqResult<string[]> {
  if (Object.entries(get(app).rxNostr.getDefaultRelays()).length <= 0) {
    setRelays(relaySearchRelays);
  }
  const operator = pipe(latest());
  const reqResult = useReq({ queryKey, filters, operator, req });

  const transformedData = derived(reqResult.data, ($data) =>
    toGlobalRelaySet($data)
  );

  return {
    data: transformedData,
    status: reqResult.status,
    error: reqResult.error,
  };
}
function toGlobalRelaySet(
  value: EventPacket | EventPacket[] | undefined | null
): string[] {
  console.log(value);

  if (!value) {
    return [];
  } else if (Array.isArray(value)) {
    return value[0].event.tags
      .filter((tag: string[]) => tag[0] === "relay")
      .map((tag: any[]) => tag[1]);
    // let writerelays: DefaultRelayConfig[] = Object.values(
    //   get(app).rxNostr.getDefaultRelays()
    // );
    // let readrelays: DefaultRelayConfig[] = Object.values(
    //   get(app).rxNostr.getDefaultRelays()
    // );

    // value.forEach((packet) => {
    //   //  if (packet.event.kind === 10002) {
    //   //   writerelays = setRelaysByKind10002(packet.event);
    //   // } else if (packet.event.kind === 30002) {
    //   readrelays = setReadRelaysByKind30002(packet.event);
    //   //  }
    // });

    // const combinedRelays = combineRelays(writerelays, readrelays);
    // //  setRelays(combinedRelays);
    // console.log(get(app).rxNostr.getDefaultRelays());
    // return combinedRelays;
  } else {
    return value.event.tags
      .filter((tag: string[]) => tag[0] === "relay")
      .map((tag: any[]) => tag[1]);
    // let writerelays: DefaultRelayConfig[] = Object.values(
    //   get(app).rxNostr.getDefaultRelays()
    // );
    // let readrelays: DefaultRelayConfig[] = Object.values(
    //   get(app).rxNostr.getDefaultRelays()
    // );

    // //if (value.event.kind === 10002) {
    // //writerelays = setRelaysByKind10002(value.event);
    // // } else if (value.event.kind === 30002) {
    // const kind30002 = setReadRelaysByKind30002(value.event);
    // //  }
    // console.log(kind30002);
    // if (kind30002.length > 0) {
    //   readrelays = kind30002;
    // }
    // const combinedRelays = combineRelays(writerelays, readrelays);
    // //setRelays(combinedRelays);
    // console.log(combinedRelays);
    // return combinedRelays;
  }
}

export function setReadRelaysByKind30002(event: Event): DefaultRelayConfig[] {
  console.log(event);
  try {
    const relayList: string[][] = event.tags.filter(
      (tag) => tag[0] === "relay"
    );
    return relayList.map(([, url = ""]) => {
      const validUrl = url || "";
      return {
        url: validUrl,
        read: true,
        write: false,
      };
    });
  } catch (error) {
    console.error("Error parsing readrelays by kind 30002", error);
    return [];
  }
}

function combineRelays(
  writerelays: DefaultRelayConfig[],
  readrelays: DefaultRelayConfig[]
): DefaultRelayConfig[] {
  const relayMap = new Map<string, DefaultRelayConfig>();
  // writerelays を relayMap に追加する
  writerelays.forEach((relay, index) => {
    relayMap.set(relay.url, {
      url: relay.url,
      write: writerelays[index].write,
      read: false,
    });
  });

  // readrelays を relayMap に追加する
  readrelays.forEach((relay) => {
    const existingRelay = relayMap.get(relay.url);
    if (existingRelay) {
      relayMap.set(relay.url, {
        ...existingRelay,
        read: true, // 既存の情報がある場合はそのままの read を保持する
      });
    } else {
      relayMap.set(relay.url, {
        url: relay.url,
        write: false,
        read: true, // 既存の情報がない場合は read を true に設定する
      });
    }
  });

  return Array.from(relayMap.values());
}
