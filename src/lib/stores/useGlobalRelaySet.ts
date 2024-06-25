import type { QueryKey } from "@tanstack/svelte-query";
import {
  latest,
  uniq,
  verify,
  type DefaultRelayConfig,
  type EventPacket,
} from "rx-nostr";
import type { RxReqBase, ReqResult } from "$lib/types.js";
import type { Filter } from "nostr-typedef";
import type { Event } from "nostr-typedef";
import { pipe } from "rxjs";
import { derived, get } from "svelte/store";
import { setRelays, useReq } from "$lib/func/nostr";
import { relaySearchRelays } from "./relays";
import { app } from "./stores";
import { scanArray } from "./operators";

//今設定されてるdefaultRelayConfigのreadだけ30002で上書きする
export function useGlobalRelaySet(
  queryKey: QueryKey,
  filters: Filter[],
  req?: RxReqBase | undefined
): ReqResult<DefaultRelayConfig[]> | undefined {
  if (Object.entries(get(app).rxNostr.getDefaultRelays()).length <= 0) {
    setRelays(relaySearchRelays);
  }
  const operator = pipe(verify(), uniq(), scanArray());
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
  value: EventPacket | EventPacket[] | undefined
): DefaultRelayConfig[] {
  console.log(value);

  if (!value) {
    return [];
  } else if (Array.isArray(value)) {
    let writerelays: DefaultRelayConfig[] = Object.values(
      get(app).rxNostr.getDefaultRelays()
    );
    let readrelays: DefaultRelayConfig[] = Object.values(
      get(app).rxNostr.getDefaultRelays()
    );

    value.forEach((packet) => {
      //  if (packet.event.kind === 10002) {
      //   writerelays = setRelaysByKind10002(packet.event);
      // } else if (packet.event.kind === 30002) {
      readrelays = setReadRelaysByKind30002(packet.event);
      //  }
    });

    const combinedRelays = combineRelays(writerelays, readrelays);
    setRelays(combinedRelays);
    console.log(get(app).rxNostr.getDefaultRelays());
    return combinedRelays;
  } else {
    let writerelays: DefaultRelayConfig[] = Object.values(
      get(app).rxNostr.getDefaultRelays()
    );
    let readrelays: DefaultRelayConfig[] = Object.values(
      get(app).rxNostr.getDefaultRelays()
    );

    //if (value.event.kind === 10002) {
    //writerelays = setRelaysByKind10002(value.event);
    // } else if (value.event.kind === 30002) {
    const kind30002 = setReadRelaysByKind30002(value.event);
    //  }
    console.log(kind30002);
    if (kind30002.length > 0) {
      readrelays = kind30002;
    }
    const combinedRelays = combineRelays(writerelays, readrelays);
    setRelays(combinedRelays);
    console.log(combinedRelays);
    return combinedRelays;
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
