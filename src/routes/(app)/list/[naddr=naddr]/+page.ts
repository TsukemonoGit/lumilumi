import * as nip19 from "nostr-tools/nip19";
//import { pubkey } from '$lib/stores/settings';
import { error } from "@sveltejs/kit";
import type { PageLoad, RouteParams } from "./$types";
import { ogDescription, ogTitle } from "$lib/stores/stores";

interface CustomParams {
  naddr: string;
}
//https://kit.svelte.jp/docs/load
//ページを読み込む前に有効なparamかチェック
export const load: PageLoad<{
  identifier: string;
  pubkey: string;
  kind: number;
  relays?: string[] | undefined;
}> = ({ params }: { params: RouteParams }) => {
  const { naddr } = params as CustomParams; // キャストして kind を取得

  try {
    const { type, data } = nip19.decode(naddr);

    console.log("[decode]", type, data);
    if (type === "naddr") {
      const naddr = data as nip19.AddressPointer;
      ogTitle.set("Lumilumi - User List");
      ogDescription.set(`User List
ID:${data.identifier}
pubkey:${nip19.npubEncode(data.pubkey)}"`);

      return naddr;
    } else {
      throw Error;
    }
  } catch (e) {
    console.error("[note decode error]", e);
    throw error(404, "Not Found");
  }
};
