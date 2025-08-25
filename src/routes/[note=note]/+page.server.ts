import * as nip19 from "nostr-tools/nip19";
import { error } from "@sveltejs/kit";
import * as Nostr from "nostr-typedef";
import { ogDescription, ogTitle } from "$lib/stores/stores";
import { eventKinds } from "$lib/func/kinds";
import { locale } from "@konemono/svelte5-i18n";
import { get } from "svelte/store";

interface CustomParams {
  note: string;
}

const defaultRelays = [
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://nostr.bitcoiner.social",
];

const fetchEvent = async (
  id: string,
  relays: string[]
): Promise<Nostr.Event | undefined> => {
  try {
    const nevent = nip19.neventEncode({ id: id, relays: relays.slice(0, 3) });

    console.debug("[api request id]", nevent, relays);
    const response = await fetch(`https://restr.mono3.workers.dev/${nevent}`, {
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

export const load = async ({
  params,
  request,
  setHeaders,
}: {
  params: CustomParams;
  request: Request;
  setHeaders: (headers: Record<string, string>) => void;
}) => {
  const { note } = params;

  setHeaders({
    "Cache-Control": "public, max-age=3600",
    "X-Robots-Tag": "noindex, nofollow",
    "Content-Type": "text/html; charset=utf-8",
  });

  console.debug("[thread page load]", note);

  // リファラーをチェックして自分のサイトからの遷移かどうかを判定
  const referer = request.headers.get("referer") || "";
  const host = request.headers.get("host") || "";

  // 自分のサイトからの遷移かどうか
  const isInternalNavigation = referer.includes(host) && host !== "";

  // 自分のサイトからの遷移でない場合にフェッチする
  const shouldFetch = !isInternalNavigation;

  console.debug("[thread page] referer:", referer);
  console.debug("[thread page] host:", host);
  console.debug("[thread page] is internal navigation:", isInternalNavigation);
  console.debug("[thread page] should fetch:", shouldFetch);

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
      skipFetch?: boolean;
    } = {
      id: "",
      relays: undefined,
      kind: undefined,
      author: undefined,
      event: undefined,
      encoded: note,
      skipFetch: !shouldFetch,
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

    // OGPクローラーの場合のみフェッチする
    if (shouldFetch) {
      res.event = await fetchEvent(
        res.id,
        res.relays?.length ? res.relays : defaultRelays
      );
      console.log(res.event);

      if (res.event) {
        const kindString = eventKinds.get(res.event.kind)?.[
          get(locale) === "ja" ? "ja" : "en"
        ];
        ogTitle.set(
          `Lumilumi - kind:${res.event.kind} ${
            kindString ? `(${kindString})` : ""
          }`
        );
        ogDescription.set(res.event.content);
      } else if (res.kind) {
        const kindString = eventKinds.get(res.kind)?.[
          get(locale) === "ja" ? "ja" : "en"
        ];
        ogTitle.set(
          `Lumilumi - kind:${res.kind} ${kindString ? `(${kindString})` : ""}`
        );
      }
    } else {
      console.debug(
        "[thread page] skipping fetch - internal navigation from same site"
      );

      // 内部遷移の場合でも、kindが分かっている場合は最低限のOG設定
      if (res.kind) {
        const kindString = eventKinds.get(res.kind)?.[
          get(locale) === "ja" ? "ja" : "en"
        ];
        ogTitle.set(
          `Lumilumi - kind:${res.kind} ${kindString ? `(${kindString})` : ""}`
        );
      }
    }

    return res;
  } catch (e) {
    console.error("[thread page decode error]", e);
    error(404, "Not Found");
  }
};
