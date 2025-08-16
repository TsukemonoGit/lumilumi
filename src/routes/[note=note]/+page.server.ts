import type { LayoutServerLoad } from "./$types";
import * as nip19 from "nostr-tools/nip19";
import { error } from "@sveltejs/kit";
import { defaultRelays } from "$lib/stores/relays";
import * as Nostr from "nostr-typedef";
import { ogDescription } from "$lib/stores/stores";

interface CustomParams {
  note: string;
}

const fetchEvent = async (
  id: string,
  relays: string[]
): Promise<Nostr.Event | undefined> => {
  console.debug("[api request id]", id, relays);
  const response = await fetch(
    `https://restr.mono3.workers.dev/${nip19.neventEncode({ id, relays })}`,
    { headers: { "User-Agent": "lumilumi" } }
  );

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

  setHeaders({ "X-Robots-Tag": "noindex, nofollow" });
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

    res.event = await fetchEvent(
      res.id,
      res.relays?.length ? res.relays : defaultRelays
    );
    if (res.event) {
      ogDescription.set(res.event.content);
    }
    return res;
  } catch (e) {
    console.error("[thread page decode error]", e);
    error(404, "Not Found");
  }
};
