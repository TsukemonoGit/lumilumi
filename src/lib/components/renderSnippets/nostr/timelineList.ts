// timelineList.ts

import { usePromiseReq } from "$lib/func/nostr";
import {
  displayEvents,
  relayConnectionState,
  relayStateMap,
} from "$lib/stores/globalRunes.svelte";
//import { scanArray } from "$lib/stores/operators";
import { defaultRelays } from "$lib/stores/stores";
import type { Filter } from "nostr-typedef";
import {
  createRxBackwardReq,
  uniq,
  type DefaultRelayConfig,
  type EventPacket,
} from "rx-nostr";
import { type OperatorFunction } from "rxjs";
import { get } from "svelte/store";

import { normalizeURL } from "nostr-tools/utils";

// // Type definition for enhanced event packet
// type EnhancedEventPacket = EventPacket & {
//   seenOn: Set<string>;
//   isNew: boolean;
// };

/**
 * Load older events based on filters and timestamp
 * @param sift - Number of events to retrieve
 * @param filters - NOSTR filters
 * @param until - Timestamp boundary for event retrieval
 * @param tie - RxJS operator for event processing
 * @param relays - List of relay URLs
 *  @param timeout - timeout miri seconds
 * @returns Promise containing array of event packets
 */
export async function loadOlderEvents(
  sift: number,
  filters: Filter[],
  until: number,
  operator: OperatorFunction<EventPacket, EventPacket[]>,
  relays?: string[],
  onData?: (data: EventPacket[]) => void, // 処理途中のデータを受け取るコールバック
  timeout?: number
): Promise<EventPacket[]> {
  // Check if display events exist
  if (!displayEvents.get() || displayEvents.get().length < 0) {
    console.log("No sliced events available, failed to retrieve older events");
    return [];
  }

  // Prepare filters with limit and timestamp boundaries
  const newFilters = filters.map((filter) => ({
    ...filter,
    limit: sift + 4,
    until: until,
    //since: undefined,
  }));

  //console.log(newFilters, sift, operator);

  // Create request and operator pipeline
  const newReq = createRxBackwardReq();

  // Fetch events
  const olderEvents = await usePromiseReq(
    {
      operator,
      filters: newFilters,
      req: newReq,
    },
    relays,
    timeout,
    onData,
    sift
  );

  newReq.over();
  // Filter events by timestamp
  const filteredOlderEvents = olderEvents.filter(
    (packet) => packet.event.created_at <= until
  );

  console.log("limit:", sift);
  console.log("Retrieved events count:", filteredOlderEvents.length);

  // Return requested number of events
  return filteredOlderEvents;
}

/**
 * Load initial batch of events
 * @param sift - Number of events to retrieve (0 means no limit)
 * @param filters - NOSTR filters
 * @param tie - RxJS operator for event processing
 * @param relays - List of relay URLs
 * @returns Promise containing array of event packets
 */
export async function firstLoadOlderEvents(
  sift: number,
  filters: Filter[],
  operator: OperatorFunction<EventPacket, EventPacket[]>,
  relays?: string[],
  onData?: (data: EventPacket[]) => void, // 処理途中のデータを受け取るコールバック
  timeout?: number
): Promise<EventPacket[]> {
  const newReq = createRxBackwardReq();

  // Fetch events with longer timeout (4000ms)
  const olderEvents = await usePromiseReq(
    {
      operator,
      filters,
      req: newReq,
    },
    relays,
    timeout,
    onData,
    sift
  );
  console.log(`📡 Older events fetch completed`, {
    requested: sift || "unlimited",
    received: olderEvents.length,
    relays: relays?.length || "default",
    filters: filters,
    hasCallback: !!onData,
  });

  // Return either all events or limited by sift
  //return olderEvents.slice(0, sift === 0 ? undefined : sift);
  return olderEvents;
}

const getRelayUrls = () => {
  const defo = get(defaultRelays);
  if (!defo) return [];
  return Object.values(defo)
    .filter((config) => config.read)
    .map((config) => config.url);
};

/**
 * Wait for sufficient relay connections before proceeding
 *
 * @param options - Optional settings
 * @param options.checkrelays - Specific relays to check (if not provided, uses all configured relays)
 * @param options.maxWaitTime - Maximum time to wait for connections in milliseconds (default 5000)
 * @param options.requiredConnectionRatio - Fraction (0..1) of relays that must be in a final state before proceeding (default 0.8)
 * @param options.onProgress - Callback invoked periodically with (connectedCount, totalRelays)
 */
export async function waitForConnections(options?: {
  checkrelays?: Record<string, DefaultRelayConfig>; // 追加
  maxWaitTime?: number;
  requiredConnectionRatio?: number;
  onProgress?: (connected: number, total: number) => void;
}): Promise<void> {
  const {
    checkrelays, // 追加
    maxWaitTime = 5000,
    requiredConnectionRatio = 0.8,
    onProgress,
  } = options ?? {};

  await new Promise((resolve) => setTimeout(resolve, 500));

  const stateMap = relayStateMap as Map<string, string>;
  const startTime = Date.now();
  const RELAY_CHECK_INTERVAL = 300;

  const getFinalStateRelayCount = (): number => {
    // checkrelays が指定されていればそれを使用、なければ既存の getRelayUrls()
    const readUrls = checkrelays ? Object.keys(checkrelays) : getRelayUrls();
    const normalizedReadUrls = readUrls.map((url) => normalizeURL(url));

    return normalizedReadUrls.filter((url) => {
      const state = stateMap.get(normalizeURL(url));
      return state !== "initialize" && state !== "connecting";
    }).length;
  };

  while (true) {
    const readUrls = checkrelays ? Object.keys(checkrelays) : getRelayUrls();
    const normalizedReadUrls = readUrls.map((url) => normalizeURL(url));
    const finalStateCount = getFinalStateRelayCount();
    const totalRelays = normalizedReadUrls.length;
    const connectionRatio =
      totalRelays === 0 ? 1 : finalStateCount / totalRelays;

    try {
      onProgress?.(finalStateCount, totalRelays);
    } catch (e) {
      console.error("waitForConnections onProgress callback error:", e);
    }

    if (connectionRatio >= requiredConnectionRatio) {
      break;
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= maxWaitTime) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, RELAY_CHECK_INTERVAL));
  }
}

/**
 * リレーが ready になるまで待機
 *
 * @param options.maxWaitTime - 最大待機時間(ms) (default: 5000)
 * @param options.checkInterval - チェック間隔(ms) (default: 100)
 * @returns ready になったら resolve、タイムアウトでも resolve
 */
export async function waitForRelayReady(options?: {
  maxWaitTime?: number;
  checkInterval?: number;
}): Promise<void> {
  const { maxWaitTime = 5000, checkInterval = 100 } = options ?? {};

  // すでに ready ならすぐ返す
  if (relayConnectionState.ready) {
    return;
  }

  const startTime = Date.now();

  return new Promise<void>((resolve) => {
    const checkInterval_id = setInterval(() => {
      if (relayConnectionState.ready) {
        clearInterval(checkInterval_id);
        resolve();
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= maxWaitTime) {
        clearInterval(checkInterval_id);
        console.warn(`Relay wait timeout after ${maxWaitTime}ms`);
        resolve();
      }
    }, checkInterval);
  });
}
