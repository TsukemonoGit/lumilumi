import * as nip19 from "nostr-tools/nip19";
import { error } from "@sveltejs/kit";
import type { PageLoad, RouteParams } from "./$types";

// カスタムパラメータの型定義
interface CustomParams {
  note: string;
}

// ページを読み込む前に有効なparamかチェック
export const load: PageLoad<{
  id: string;
  relays?: string[] | undefined;
  kind?: number | undefined;
  author?: string | undefined;
}> = ({ params }: { params: RouteParams }) => {
  const { note } = params as CustomParams;

  try {
    const { type, data } = nip19.decode(note);

    if (type === "nevent") {
      const nevent = data as nip19.EventPointer;

      return {
        id: nevent.id,
        relays:
          nevent.relays && nevent.relays.length > 0 ? nevent.relays : undefined,
        kind: nevent.kind,
        author: nevent.author,
      };
    } else if (type === "note") {
      return { id: data as string };
    } else {
      // サポートされていないNostr IDタイプの場合
      throw new Error("Invalid Nostr ID type");
    }
  } catch (e) {
    console.error("Nostr IDのデコードに失敗:", e);
    throw error(404, "Not Found");
  }
};
