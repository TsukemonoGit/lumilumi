import * as nip19 from "nostr-tools/nip19";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { ogDescription, ogTitle } from "$lib/stores/stores";
import { eventKinds } from "$lib/func/kinds";
import { locale } from "@konemono/svelte5-i18n";
import { get } from "svelte/store";
import { relayRegex2 } from "$lib/func/regex";
import * as Nostr from "nostr-typedef";

interface CustomParams {
  note: string;
}

interface LoadResult {
  id: string;
  relays?: string[];
  kind?: number;
  author?: string;
}

export const load: PageServerLoad = async ({ params, request }) => {
  const { note } = params as CustomParams;

  try {
    const { type, data } = nip19.decode(note);

    if (type === "nevent") {
      return handleNevent(data as nip19.EventPointer, request);
    } else if (type === "note") {
      return handleNote(data as string, request);
    } else {
      throw new Error("Unsupported type");
    }
  } catch (e) {
    throw error(404, "Not Found");
  }
};

async function handleNevent(
  nevent: nip19.EventPointer,
  request: Request
): Promise<LoadResult> {
  const kindString = getKindString(nevent.kind);
  const event = await fetchEventIfNotBrowser(request, nevent.id);

  if (event) {
    setOgMetaWithEvent(event, nevent.kind, kindString);
  } else {
    setOgMetaWithoutEvent(nevent, kindString);
  }

  const nrelays = nevent.relays?.filter((relay) => relayRegex2.test(relay));

  return {
    id: nevent.id,
    relays: nrelays && nrelays.length > 0 ? nrelays : undefined,
    kind: nevent.kind,
    author: nevent.author,
  };
}

async function handleNote(data: string, request: Request): Promise<LoadResult> {
  const event = await fetchEventIfNotBrowser(request, data);

  if (event) {
    const kindString = getKindString(event.kind);
    setOgMetaWithEvent(event, event.kind, kindString);
  } else {
    setOgMetaForNoteOnly(data);
  }

  return { id: data };
}

async function fetchEventIfNotBrowser(
  request: Request,
  eventId: string
): Promise<Nostr.Event | undefined> {
  const userAgent = request.headers.get("user-agent") || "";

  if (!/Mozilla|Chrome|Safari|Edge/.test(userAgent)) {
    try {
      const res = await fetch(`https://restr.mono3.workers.dev/${eventId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      // フェッチエラーの場合はundefinedを返す
    }
  }

  return undefined;
}

function getKindString(kind?: number): string | undefined {
  return kind
    ? eventKinds.get(kind)?.[get(locale) === "ja" ? "ja" : "en"]
    : undefined;
}

function setOgMetaWithEvent(
  event: Nostr.Event,
  kind?: number,
  kindString?: string
): void {
  ogTitle.set(`Lumilumi - kind:${kind} ${kindString ? `(${kindString})` : ""}`);
  ogDescription.set(
    event.content.length < 50
      ? event.content
      : `${event.content.slice(0, 50)}...`
  );
}

function setOgMetaWithoutEvent(
  nevent: nip19.EventPointer,
  kindString?: string
): void {
  ogTitle.set(
    `Lumilumi - kind:${nevent.kind} ${kindString ? `(${kindString})` : ""}`
  );
  ogDescription.set(`kind:${nevent.kind} ${kindString ? `(${kindString})` : ""}
noteID:${nip19.noteEncode(nevent.id)}
${nevent.author ? `pubkey:${nip19.npubEncode(nevent.author)}` : ""}`);
}

function setOgMetaForNoteOnly(data: string): void {
  ogTitle.set(`Lumilumi - note:${nip19.noteEncode(data)}`);
  ogDescription.set(`noteID:${nip19.noteEncode(data)}`);
}
