import type { LayoutServerLoad } from "./$types";
import * as nip19 from "nostr-tools/nip19";
import { error } from "@sveltejs/kit";
import * as Nostr from "nostr-typedef";
import { ogDescription, ogTitle } from "$lib/stores/stores";

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

const fetchEvent = async (
  encoded: string,
  relays: string[]
): Promise<Nostr.Event | undefined> => {
  console.debug("[api request id]", encoded, relays);
  const response = await fetch(`https://restr.mono3.workers.dev/${encoded}`, {
    headers: { "User-Agent": "lumilumi" },
  });

  if (!response.ok) {
    console.warn("[api event not found]", await response.text());
    return undefined;
  }

  const event = (await response.json()) as Nostr.Event;
  console.debug("[api response]", event);
  return event;
};

export const load: LayoutServerLoad = async ({
  params,
  setHeaders,
}: {
  params: CustomParams;
  setHeaders: (headers: Record<string, string>) => void;
}) => {
  const { note } = params;

  setHeaders({
    "Cache-Control": "public, max-age=3600",
    "X-Robots-Tag": "index, follow", // noindexを変更
    "Content-Type": "text/html; charset=utf-8",
  });
  console.debug("[thread page load]", note);

  try {
    const { type, data } = nip19.decode(note);
    console.debug("[thread decode]", type, data);

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
        break;
      case "nevent":
        res.id = data.id;
        res.kind = data.kind;
        res.author = data.author;
        break;
      default:
        error(500);
    }
    ogTitle.set(`Lumilumi - kind:${res.kind}`);
    res.event = await fetchEvent(
      res.encoded,
      res.relays?.length ? res.relays : defaultRelays
    );
    console.log(res.event);
    if (res.event) {
      ogDescription.set(res.event.content);
    } else {
    }
    return res;
  } catch (e) {
    console.error("[thread page decode error]", e);
    error(404, "Not Found");
  }
};
