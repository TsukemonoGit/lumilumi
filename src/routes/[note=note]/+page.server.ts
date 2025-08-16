import type { LayoutServerLoad } from "./$types";
import * as nip19 from "nostr-tools/nip19";
import { error } from "@sveltejs/kit";
import * as Nostr from "nostr-typedef";
import { ogDescription } from "$lib/stores/stores";

interface CustomParams {
  note: string;
}

const defaultRelays = [
  //'wss://tes'
  //'wss://relay.nostr.wirednet.jp'
  "wss://relay.nostr.band",
  "wss://nos.lol",
  // "wss://relayable.org",

  "wss://nostr.bitcoiner.social",
];

let debugLog = "";

const addLog = (message: string) => {
  debugLog += `${message} | `;
  ogDescription.set(debugLog);
};

const fetchEvent = async (
  encoded: string,
  relays: string[]
): Promise<Nostr.Event | undefined> => {
  console.debug("[api request id]", encoded, relays);
  addLog(`fetch start: ${encoded}`);

  try {
    const response = await fetch(`https://restr.mono3.workers.dev/${encoded}`, {
      headers: { "User-Agent": "lumilumi" },
    });

    addLog(`response: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[api event not found]", errorText);
      addLog(`failed: ${errorText.slice(0, 50)}`);
      return undefined;
    }

    const event = (await response.json()) as Nostr.Event;
    console.debug("[api response]", event);
    addLog(`success: ${event.id.slice(0, 8)}`);
    return event;
  } catch (fetchError: any) {
    console.error("[fetch error]", fetchError);
    addLog(`error: ${fetchError.message}`);
    return undefined;
  }
};

export const load: LayoutServerLoad = async ({
  params,
  setHeaders,
}: {
  params: CustomParams;
  setHeaders: (headers: Record<string, string>) => void;
}) => {
  const { note } = params;

  setHeaders({ "X-Robots-Tag": "noindex, nofollow" });
  console.debug("[thread page load]", note);
  debugLog = ""; // リセット
  addLog(`start: ${note.slice(0, 20)}`);

  try {
    const { type, data } = nip19.decode(note);
    console.debug("[thread decode]", type, data);
    addLog(`decoded: ${type}`);

    const res: {
      id: string;
      relays?: string[];
      kind?: number;
      author?: string;
      event?: Nostr.Event;
      encoded: string;
    } = {
      id: "",
      relays: undefined,
      kind: undefined,
      author: undefined,
      event: undefined,
      encoded: note,
    };

    switch (type) {
      case "note":
        res.id = data;
        addLog(`note: ${data.slice(0, 8)}`);
        break;
      case "nevent":
        res.id = data.id;
        res.kind = data.kind;
        res.author = data.author;
        res.relays = data.relays;
        addLog(
          `nevent: ${data.id.slice(0, 8)}, relays: ${data.relays?.length || 0}`
        );
        break;
      default:
        addLog(`unknown: ${type}`);
        error(500);
    }

    const relaysToUse = res.relays?.length ? res.relays : defaultRelays;
    addLog(`relays: ${relaysToUse.length}`);

    res.event = await fetchEvent(res.encoded, relaysToUse);
    console.log(res.event);

    if (res.event) {
      addLog(`final: ${res.event.content.slice(0, 50)}`);
    } else {
      addLog("final: no event");
    }
    return res;
  } catch (e: any) {
    console.error("[thread page decode error]", e);
    addLog(`decode error: ${e.message}`);
    error(404, "Not Found");
  }
};
