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
  naddrPointer: nip19.AddressPointer
): Promise<Nostr.Event | undefined> => {
  try {
    const naddr = nip19.naddrEncode(naddrPointer);
    console.debug("[api request id]", naddr);
    const response = await fetch(`https://restr.mono3.workers.dev/${naddr}`, {
      headers: { "User-Agent": "lumilumi" },
    });

    if (!response.ok) {
      console.warn("[api event not found]", await response.text());
      return undefined;
    }

    const event = (await response.json()) as Nostr.Event;
    console.debug("[api response]", event);
    return event;
  } catch (error) {
    return undefined;
  }
};

export const load: PageServerLoad = async ({
  params,
  request,
  setHeaders,
}: {
  params: CustomParams;
  request: Request;
  setHeaders: (headers: Record<string, string>) => void;
}) => {
  const { naddr } = params;

  setHeaders({
    "Cache-Control": "public, max-age=3600",
    "X-Robots-Tag": "noindex, nofollow",
    "Content-Type": "text/html; charset=utf-8",
  });

  console.debug("[naddr page load]", naddr);

  // リファラーをチェックして自分のサイトからの遷移かどうかを判定
  const referer = request.headers.get("referer") || "";
  const host = request.headers.get("host") || "";

  // 自分のサイトからの遷移かどうか
  const isInternalNavigation = referer.includes(host) && host !== "";

  // 自分のサイトからの遷移でない場合にフェッチする
  const shouldFetch = !isInternalNavigation;

  console.debug("[naddr page] referer:", referer);
  console.debug("[naddr page] host:", host);
  console.debug("[naddr page] is internal navigation:", isInternalNavigation);
  console.debug("[naddr page] should fetch:", shouldFetch);

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
      skipFetch?: boolean;
    } = {
      identifier: addr.identifier,
      pubkey: addr.pubkey,
      kind: addr.kind,
      relays: addr.relays,
      event: undefined,
      encoded: naddr,
      skipFetch: !shouldFetch,
    };

    const kindString = eventKinds.get(res.kind)?.[
      get(locale) === "ja" ? "ja" : "en"
    ];

    // OGPクローラーの場合のみフェッチする
    if (shouldFetch) {
      res.event = await fetchEvent({
        identifier: res.identifier,
        pubkey: res.pubkey,
        kind: res.kind,
        relays: (res.relays?.length ? res.relays : defaultRelays).slice(0, 3),
      });

      if (res.event) {
        const title = res.event.tags.find((tag) => tag[0] === "title")?.[1];
        const desc = res.event.tags.find(
          (tag) => tag[0] === "description" || tag[0] === "summary"
        )?.[1];
        ogTitle.set(
          `Lumilumi - kind:${res.kind} ${
            title ? title : kindString ? `(${kindString})` : ""
          }`
        );
        ogDescription.set(desc || "");
      } else {
        ogTitle.set(
          `Lumilumi - kind:${res.kind} ${kindString ? `(${kindString})` : ""}`
        );
        ogDescription.set(`Id:${res.identifier}`);
      }
    } else {
      console.debug(
        "[naddr page] skipping fetch - internal navigation from same site"
      );

      // 内部遷移の場合でも最低限のOG設定
      ogTitle.set(
        `Lumilumi - kind:${res.kind} ${kindString ? `(${kindString})` : ""}`
      );
      ogDescription.set(`Id:${res.identifier}`);
    }

    return res;
  } catch (e) {
    console.error("[naddr page decode error]", e);
    throw error(404, "Not Found");
  }
};
