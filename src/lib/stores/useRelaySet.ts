import type { QueryKey } from "@tanstack/svelte-query";
import {
  latest,
  verify,
  type DefaultRelayConfig,
  type EventPacket,
  type RxNostr,
} from "rx-nostr";
import type { RxReqBase, ReqResult } from "$lib/types.js";
import type { Filter } from "nostr-typedef";
import type { Event } from "nostr-typedef";
import { pipe } from "rxjs";
import { derived, writable } from "svelte/store";
import { setRelays, useReq } from "$lib/func/nostr";
import { relaySearchRelays } from "./relays";

export function useRelaySet(
  _rxNostr: RxNostr,
  queryKey: QueryKey,
  filters: Filter[],
  req?: RxReqBase | undefined
): ReqResult<DefaultRelayConfig[]> | undefined {
  if (!_rxNostr) {
    return undefined;
  }
  if (Object.entries(_rxNostr.getDefaultRelays()).length <= 0) {
    setRelays(relaySearchRelays);
  }
  const operator = pipe(verify(), latest());
  const reqResult = useReq({ queryKey, filters, operator, req });

  const transformedData = derived(reqResult.data, ($data) => toRelaySet($data));

  return {
    data: transformedData,
    status: reqResult.status,
    error: reqResult.error,
  };
}

function toRelaySet(
  value: EventPacket | EventPacket[] | undefined
): DefaultRelayConfig[] {
  console.log(value);
  if (!value) {
    return [];
  } else if (Array.isArray(value)) {
    let relay: DefaultRelayConfig[] = [];
    value.forEach((packet) => {
      if (packet.event.kind === 3) {
        relay = relay.concat(setRelaysByKind3(packet.event));
      } else if (packet.event.kind === 10002) {
        relay = relay.concat(setRelaysByKind10002(packet.event));
      }
    });
    return relay;
  } else {
    return value.event.kind === 3
      ? setRelaysByKind3(value.event)
      : setRelaysByKind10002(value.event);
  }
}

function setRelaysByKind3(event: Event): DefaultRelayConfig[] {
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

function setRelaysByKind10002(event: Event): DefaultRelayConfig[] {
  console.log(event);
  try {
    const relayList: string[][] = event.tags;
    return relayList.map(([, url, ...config]) => {
      let conf: DefaultRelayConfig = { url: url, read: false, write: false };
      if (!config || config.length <= 0) return conf;
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
