import * as nip19 from "nostr-tools/nip19";
//import { pubkey } from '$lib/stores/settings';
import { error } from "@sveltejs/kit";
import type { PageLoad, RouteParams } from "./$types";
import { ogDescription, ogTitle } from "$lib/stores/stores";

interface CustomParams {
  note: string;
}
//https://kit.svelte.jp/docs/load
//ページを読み込む前に有効なparamかチェック
export const load: PageLoad<nip19.EventPointer> = ({
  params,
}: {
  params: RouteParams;
}) => {
  const { note } = params as CustomParams; // キャストして kind を取得

  //console.log(note);

  try {
    const { type, data } = nip19.decode(note);
    ogTitle.set("Lumilumi - Public chat");
    //console.log("[decode]", type, data);
    if (type === "nevent") {
      const nevent = data as nip19.EventPointer;

      ogDescription.set(`Public chat 
RoomId:${nip19.neventEncode({
        id: data.id,
        relays: data.relays ?? [],
      })}`);
      return nevent;
    } else if (type === "note") {
      ogDescription.set(`Public chat 
RoomId:${nip19.neventEncode({
        id: data,
      })}`);

      return { id: data as string } as nip19.EventPointer;
    } else {
      throw Error;
    }
  } catch (e) {
    //console.error("[note decode error]", e);
    throw error(404, "Not Found");
  }
};
