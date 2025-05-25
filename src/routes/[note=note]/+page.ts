import { nip19 } from "nostr-tools";
//import { pubkey } from '$lib/stores/settings';
import { error } from "@sveltejs/kit";
import type { PageLoad, RouteParams } from "./$types";
import { ogDescription, ogTitle } from "$lib/stores/stores";
import { eventKinds } from "$lib/func/kinds";
import { locale } from "@konemono/svelte5-i18n";
import { get } from "svelte/store";
import { relayRegex2 } from "$lib/func/regex";

interface CustomParams {
  note: string;
}
//https://kit.svelte.jp/docs/load
//ページを読み込む前に有効なparamかチェック
export const load: PageLoad<{
  id: string;
  relays?: string[] | undefined;
  kind?: number | undefined;
  author?: string | undefined;
}> = ({ params }: { params: RouteParams }) => {
  const { note } = params as CustomParams; // キャストして kind を取得

  //console.log(note);

  try {
    const { type, data } = nip19.decode(note);

    // console.log("[decode]", type, data);
    if (type === "nevent") {
      const nevent = data as nip19.EventPointer;

      const kindString = data.kind
        ? eventKinds.get(data.kind)?.[get(locale) === "ja" ? "ja" : "en"]
        : undefined;
      ogTitle.set(
        `Lumilumi - kind:${data.kind} ${kindString ? `(${kindString})` : ""}`
      );
      ogDescription.set(`kind:${data.kind} ${
        kindString ? `(${kindString})` : ""
      }
noteID:${nip19.noteEncode(data.id)}
${data.author ? `pubkey:${nip19.npubEncode(data.author)}` : ""}`);
      const nrelays = nevent.relays?.filter((relay) => relayRegex2.test(relay));

      return {
        id: nevent.id,
        relays: nrelays && nrelays.length > 0 ? nrelays : undefined,
        kind: nevent.kind,
        author: nevent.author,
      };
    } else if (type === "note") {
      ogTitle.set(`Lumilumi - note:${nip19.noteEncode(data)}`);
      ogDescription.set(`noteID:${nip19.noteEncode(data)}`);
      return { id: data as string };
    } else {
      throw Error;
    }
  } catch (e) {
    //  console.error("[note decode error]", e);
    throw error(404, "Not Found");
  }
};
