// +layout.ts

//import { locale, waitLocale } from "@konemono/svelte5-i18n";
import type { LayoutLoad } from "./$types";
import * as nip19 from "nostr-tools/nip19";
import { relayRegex2 } from "$lib/func/regex";
import { error } from "@sveltejs/kit";

//デフォリレーを設定するために必要
//めんどくさいから必要なもの(relays)だけ
export const load: LayoutLoad = async (
  params
): Promise<{ relays?: string[] | undefined } | undefined> => {
  //await waitLocale();
  const p = params; // キャストして kind を取得

  //pram
  const noteParam = p.params.note;
  const naddrParam = p.params.naddr;
  const npubParam = p.params.npub;
  if (noteParam) {
    try {
      const { type, data } = nip19.decode(noteParam);

      // console.log("[decode]", type, data);
      if (type === "nevent") {
        const nevent = data as nip19.EventPointer;
        const nrelays = nevent.relays?.filter((relay) =>
          relayRegex2.test(relay)
        );

        return {
          relays: nrelays && nrelays.length > 0 ? nrelays : undefined,
        };
      } else if (type === "note") {
        return undefined;
      } else {
        throw Error;
      }
    } catch (e) {
      //  console.error("[note decode error]", e);
      throw error(400, "Bad Request");
    }
  }
  if (naddrParam) {
    try {
      const { data, type } = nip19.decode(naddrParam);
      if (type === "naddr") {
        const naddr = data as nip19.AddressPointer;
        const nrelays = naddr.relays?.filter((relay) =>
          relayRegex2.test(relay)
        );
        return {
          relays: nrelays && nrelays.length > 0 ? nrelays : undefined,
        };
      }
    } catch (e) {
      throw error(400, "Bad Request");
    }
  }
  if (npubParam) {
    try {
      const { type, data } = nip19.decode(npubParam);

      // console.log("[decode]", type, data);
      if (type === "nprofile") {
        const nprofile = data as nip19.ProfilePointer;
        const nrelays = nprofile.relays?.filter((relay) =>
          relayRegex2.test(relay)
        );

        return {
          relays: nrelays && nrelays.length > 0 ? nrelays : undefined,
        };
      } else if (type === "npub") {
        return undefined;
      } else {
        throw Error;
      }
    } catch (e) {
      return undefined;
      //  console.error("[note decode error]", e);
      // throw error(400, "Bad Request");
    }
  }
};
