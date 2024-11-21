// +layout.ts
import { browser } from "$app/environment";
import "$lib/i18n"; // Import to initialize. Important :)
import { locale, waitLocale } from "svelte-i18n";
import type { LayoutLoad } from "./$types";
import { nip19 } from "nostr-tools";
export const prerender = true;
export const ssr = true;
export const load: LayoutLoad = async (
  params
): Promise<
  | {
      id: string;
      relays?: string[] | undefined;
      kind?: number | undefined;
      author?: string | undefined;
    }
  | undefined
> => {
  if (browser) {
    locale.set(window.navigator.language);
  }
  await waitLocale();
  const p = params; // キャストして kind を取得
  const noteParam = p.params.note;
  if (noteParam) {
    try {
      const { type, data } = nip19.decode(noteParam);

      // console.log("[decode]", type, data);
      if (type === "nevent") {
        const nevent = data as nip19.EventPointer;
        return nevent;
      } else if (type === "note") {
        return { id: data as string };
      } else {
        throw Error;
      }
    } catch (e) {
      //  console.error("[note decode error]", e);
    }
  }
};
