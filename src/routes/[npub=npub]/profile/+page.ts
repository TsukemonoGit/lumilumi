import { nip19 } from "nostr-tools";
//import { pubkey } from '$lib/stores/settings';
import { error } from "@sveltejs/kit";
import type { PageLoad, RouteParams } from "./$types";
import { get } from "svelte/store";
import { app } from "$lib/stores/stores";

interface CustomParams {
  npub: string;
}
//https://kit.svelte.jp/docs/load
//ページを読み込む前に有効なparamかチェック
export const load: PageLoad<{
  pubkey: string;
}> = ({ params }: { params: RouteParams }) => {
  const { npub } = params as CustomParams; // キャストして kind を取得
  if (
    !get(app) ||
    Object.entries(get(app)?.rxNostr.getDefaultRelays()).length <= 0
  ) {
    //  throw error(406, "Not Acceptable");//npubとおってこなかったとき
  }

  //console.log(npub);

  try {
    const { type, data } = nip19.decode(npub);

    // console.log("[decode]", type, data);

    return { pubkey: data as string };
  } catch (e) {
    //  console.error("[npub decode error]", e);
    throw error(404, "Not Found");
  }
};
