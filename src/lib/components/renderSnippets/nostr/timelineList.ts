// timelineList.ts

import { usePromiseReq } from "$lib/func/nostr";
import { displayEvents, relayStateMap } from "$lib/stores/globalRunes.svelte";
import { scanArray } from "$lib/stores/operators";
import { defaultRelays } from "$lib/stores/stores";
import type { Filter } from "nostr-typedef";
import { createRxBackwardReq, uniq, type EventPacket } from "rx-nostr";
import { pipe, type OperatorFunction } from "rxjs";
import { get } from "svelte/store";

import { normalizeURL } from "nostr-tools/utils";

// Type definition for enhanced event packet
type EnhancedEventPacket = EventPacket & {
  seenOn: Set<string>;
  isNew: boolean;
};

// Common operator pipeline function
const createOperatorPipeline = (
  tie: OperatorFunction<EventPacket, EnhancedEventPacket>
) => {
  return pipe(tie, uniq(), scanArray());
};

/**
 * Load older events based on filters and timestamp
 * @param sift - Number of events to retrieve
 * @param filters - NOSTR filters
 * @param until - Timestamp boundary for event retrieval
 * @param tie - RxJS operator for event processing
 * @param relays - List of relay URLs
 * @returns Promise containing array of event packets
 */
export async function loadOlderEvents(
  sift: number,
  filters: Filter[],
  until: number,
  tie: OperatorFunction<EventPacket, EnhancedEventPacket>,
  relays?: string[],
  onData?: (data: EventPacket[]) => void // 処理途中のデータを受け取るコールバック
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

  console.log(newFilters);

  // Create request and operator pipeline
  const newReq = createRxBackwardReq();
  const operator = createOperatorPipeline(tie);

  // Fetch events
  const olderEvents = await usePromiseReq(
    {
      operator,
      filters: newFilters,
      req: newReq,
    },
    relays,
    undefined,
    onData,
    sift
  );

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
  tie: OperatorFunction<EventPacket, EnhancedEventPacket>,
  relays?: string[],
  onData?: (data: EventPacket[]) => void // 処理途中のデータを受け取るコールバック
): Promise<EventPacket[]> {
  const newReq = createRxBackwardReq();
  const operator = createOperatorPipeline(tie);

  // Fetch events with longer timeout (4000ms)
  const olderEvents = await usePromiseReq(
    {
      operator,
      filters,
      req: newReq,
    },
    relays,
    4000,
    onData,
    sift
  );

  console.log(`📡 Older events fetch completed`, {
    requested: sift || "unlimited",
    received: olderEvents.length,
    relays: relays?.length || "default",
    filtersCount: filters.length,
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

 * @param maxWaitTime - Maximum time to wait for connections in milliseconds
 */
export async function waitForConnections(
  maxWaitTime: number = 5000
): Promise<void> {
  const readUrls = getRelayUrls();
  const stateMap = relayStateMap.get() as Map<string, string>;
  const normalizedReadUrls = readUrls.map((url) => normalizeURL(url));
  const startTime = Date.now();
  const RELAY_CHECK_INTERVAL = 500; // milliseconds
  const REQUIRED_CONNECTION_RATIO = 0.8; // 80% of relays must be connected

  // Function to check how many relays have reached a final connection state
  const getFinalStateRelayCount = (): number => {
    return normalizedReadUrls.filter((url) => {
      const state = stateMap.get(normalizeURL(url));
      return state !== "initialize" && state !== "connecting";
    }).length;
  };

  // Wait until sufficient relays are connected or timeout is reached
  while (true) {
    const finalStateCount = getFinalStateRelayCount();
    const totalRelays = normalizedReadUrls.length;
    const connectionRatio = finalStateCount / totalRelays;

    console.log(`Progress: ${finalStateCount} out of ${totalRelays} relays`);

    if (connectionRatio >= REQUIRED_CONNECTION_RATIO) {
      console.log(
        `${Math.round(
          connectionRatio * 100
        )}% relays are in a final state. Proceeding...`
      );
      break;
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= maxWaitTime) {
      console.log("Maximum wait time exceeded. Proceeding...");
      break;
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, RELAY_CHECK_INTERVAL));
  }
}
