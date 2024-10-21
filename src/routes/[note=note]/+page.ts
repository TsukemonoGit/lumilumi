import { nip19 } from "nostr-tools";
//import { pubkey } from '$lib/stores/settings';
import { error } from "@sveltejs/kit";
import type { PageLoad, RouteParams } from "./$types";
import { ogDescription } from "$lib/stores/stores";
import { eventKinds } from "$lib/func/kinds";

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
      ogDescription.set(`${
        data.kind ? eventKinds.get(data.kind)?.en ?? `kind:${data.kind}` : ""
      }  noteID:${nip19.noteEncode(data.id)}
${data.author ? `pubkey:${nip19.npubEncode(data.author)}` : ""}`);
      return nevent;
    } else if (type === "note") {
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
