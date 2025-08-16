// /page/[naddr]/+page.server.ts
import type { PageServerLoad } from "./$types";
import * as nip19 from "nostr-tools/nip19";
import { error } from "@sveltejs/kit";
import * as Nostr from "nostr-typedef";
import { ogDescription, ogTitle } from "$lib/stores/stores";
import { eventKinds } from "$lib/func/kinds";
import { locale } from "@konemono/svelte5-i18n";
import { get } from "svelte/store";

interface CustomParams {
  naddr: string;
}

const defaultRelays = [
  "wss://relay.nostr.band",
  "wss://nos.lol",
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

export const load: PageServerLoad = async ({
  params,
  setHeaders,
}: {
  params: CustomParams;
  setHeaders: (headers: Record<string, string>) => void;
}) => {
  const { naddr } = params;

  setHeaders({ "X-Robots-Tag": "noindex, nofollow" });

  try {
    const { type, data } = nip19.decode(naddr);

    if (type !== "naddr") throw Error();

    const addr = data as nip19.AddressPointer;

    const res: {
      identifier: string;
      pubkey: string;
      kind: number;
      relays?: string[];
      event?: Nostr.Event;
      encoded: string;
    } = {
      identifier: addr.identifier,
      pubkey: addr.pubkey,
      kind: addr.kind,
      relays: addr.relays,
      event: undefined,
      encoded: naddr,
    };

    res.event = await fetchEvent(
      res.encoded,
      res.relays?.length ? res.relays : defaultRelays
    );

    const kindString = eventKinds.get(res.kind)?.[
      get(locale) === "ja" ? "ja" : "en"
    ];

    if (res.event) {
      const title = res.event.tags.find((tag) => tag[0] === "title")?.[1];
      const desc = res.event.tags.find(
        (tag) => tag[0] === "description" || tag[0] === "summary"
      )?.[1];
      ogTitle.set(
        `Lumilumi - kind:${res.kind} ${
          title || kindString ? `(${kindString})` : ""
        }`
      );
      ogDescription.set(desc || "");
    } else {
      ogTitle.set(
        `Lumilumi - kind:${res.kind} ${kindString ? `(${kindString})` : ""}`
      );
      ogDescription.set(`Id:${res.identifier}`);
    }

    return res;
  } catch (e) {
    throw error(404, "Not Found");
  }
};
