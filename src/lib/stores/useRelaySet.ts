//useRelaySet.ts
import type { QueryKey } from "@tanstack/svelte-query";
import {
  completeOnTimeout,
  uniq,
  type DefaultRelayConfig,
  type EventPacket,
  type RxReq,
  type RxReqEmittable,
  type RxReqOverable,
  type RxReqPipeable,
} from "rx-nostr";
import type { ReqResult } from "$lib/types.js";
import type { Filter } from "nostr-typedef";
import type { Event } from "nostr-typedef";
import { pipe } from "rxjs";
import { derived, get } from "svelte/store";
import { setRelays } from "$lib/func/nostr";
import { relaySearchRelays } from "./relays";
import { app } from "./stores";
import { scanArray } from "./operators";
import * as Nostr from "nostr-typedef";
import { useReq } from "$lib/func/useReq";
export function useRelaySet(
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
): ReqResult<DefaultRelayConfig[]> | undefined {
  setRelays(relaySearchRelays);

  const operator = pipe(uniq(), scanArray(), completeOnTimeout(5000));
  const reqResult = useReq({ queryKey, filters, operator, req }, undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
    initialDataUpdatedAt: undefined,
    refetchInterval: Infinity,
  });

  const transformedData = derived(reqResult.data, ($data) => toRelaySet($data));

  return {
    data: transformedData,
    status: reqResult.status,
    error: reqResult.error,
  };
}
let kind10002: Nostr.Event;
let kind3: Nostr.Event;
let relay: DefaultRelayConfig[] = [];
export function toRelaySet(
  value: EventPacket | EventPacket[] | undefined | null
): DefaultRelayConfig[] {
  console.log(value);
  if (!value) {
    return [];
  } else if (Array.isArray(value)) {
    value.forEach((packet) => {
      if (packet.event.kind === 3) {
        if (
          !kind10002 &&
          (!kind3 || packet.event.created_at > kind3.created_at)
        )
          relay = setRelaysByKind3(packet.event);
        kind3 = packet.event;
      } else if (packet.event.kind === 10002) {
        if (!kind10002 || packet.event.created_at > kind10002.created_at)
          relay = setRelaysByKind10002(packet.event);
      }
    });
    setRelays(relay); //ここでデフォルトリレーにセットしてみる（）
    console.log(get(app).rxNostr.getDefaultRelays());
    return relay;
  } else {
    const relay =
      value.event.kind === 3
        ? setRelaysByKind3(value.event)
        : setRelaysByKind10002(value.event);

    setRelays(relay); //ここでデフォルトリレーにセットしてみる（）
    console.log(get(app).rxNostr.getDefaultRelays());
    return relay;
  }
}

export function setRelaysByKind3(event: Event): DefaultRelayConfig[] {
  console.log(event);
  try {
    const relayList: { [key: string]: { read: boolean; write: boolean } } =
      JSON.parse(event.content);
    return Object.entries(relayList).map(([url, config]) => ({
      url: url,
      read: config.read,
      write: config.write,
    }));
  } catch (error) {
    console.error("Error parsing relays by kind 3", error);
    return [];
  }
}

export function setRelaysByKind10002(event: Event): DefaultRelayConfig[] {
  console.log(event);
  try {
    const relayList: string[][] = event.tags;
    return relayList.map(([, url, ...config]) => {
      let conf: DefaultRelayConfig = { url: url, read: false, write: false };
      if (!config || config.length <= 0)
        return (conf = { ...conf, read: true, write: true });
      if (config.find((item) => item === "read"))
        conf = { ...conf, read: true };
      if (config.find((item) => item === "write"))
        conf = { ...conf, write: true };
      return conf;
    });
  } catch (error) {
    console.error("Error parsing relays by kind 10002", error);
    return [];
  }
}
