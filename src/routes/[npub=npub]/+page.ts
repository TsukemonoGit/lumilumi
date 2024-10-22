import { nip19 } from "nostr-tools";
//import { pubkey } from '$lib/stores/settings';
import { error } from "@sveltejs/kit";
import type { PageLoad, RouteParams } from "./$types";
import { ogDescription, ogTitle } from "$lib/stores/stores";

interface CustomParams {
  npub: string;
}
//https://kit.svelte.jp/docs/load
//ページを読み込む前に有効なparamかチェック
export const load: PageLoad<{
  pubkey: string;
  relays?: string[] | undefined;
}> = ({ params }: { params: RouteParams }) => {
  const { npub } = params as CustomParams; // キャストして kind を取得

  //console.log(npub);

  try {
    const { type, data } = nip19.decode(npub);
    if (type === "npub") {
      //console.log("[decode]", type, data);

      ogTitle.set(`Lumilumi - User:${nip19.npubEncode(data as string)}`);

      ogDescription.set(`User:${nip19.npubEncode(data as string)}`);
      return { pubkey: data as string };
    } else if (type === "nprofile") {
      ogTitle.set(`Lumilumi - User:${nip19.npubEncode(data.pubkey)}`);

      ogDescription.set(`User:${nip19.npubEncode(data.pubkey)}`);

      return { pubkey: data.pubkey, relays: data.relays ?? undefined };
    } else {
      throw error(404, "Not Found");
    }
  } catch (e) {
    //  console.error("[npub decode error]", e);
    throw error(404, "Not Found");
  }
};
