import { verifyEvent, type EventTemplate } from "nostr-tools";
import { getZapEndpoint, makeZapRequest } from "nostr-tools/nip57";
import * as Nostr from "nostr-typedef";
import { getDefaultWriteRelays, usePromiseReq } from "./nostr";
import { bech32 } from "@scure/base";
import { type QueryKey } from "@tanstack/svelte-query";
import { get } from "svelte/store";
import { queryClient } from "$lib/stores/stores";
import { latest, uniq, type EventPacket } from "rx-nostr";
import { pipe } from "rxjs";

export interface InvoiceProp {
  metadata: Nostr.Event;
  id?: string;
  amount: number;
  comment: string;
  zapRelays: string[];
}
export async function makeInvoice({
  metadata,
  id,
  amount, //1000かけたやつをいれる
  comment,
  zapRelays,
}: InvoiceProp): Promise<string | null> {
  try {
    const zapEndpoint = await getZapEndpoint(metadata);
    console.log(zapEndpoint);
    if (!zapEndpoint) {
      return null;
    }

    const zapRequest: EventTemplate = makeZapRequest({
      profile: metadata.pubkey,
      event: id ?? null,
      amount: amount,
      relays: zapRelays,
      comment: comment,
    });
    const signedRequest = await (window.nostr as Nostr.Nip07.Nostr)?.signEvent(
      zapRequest
    );
    const encoded = encodeURI(JSON.stringify(signedRequest));

    const url = `${zapEndpoint}?amount=${amount}&nostr=${encoded}`;
    console.log("[zap url]", url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[zap failed]", await response.text());

      return null;
    }
    const payment = await response.json();
    const { pr: zapInvoice } = payment;
    console.log("[zap invoice]", zapInvoice);
    if (zapInvoice === undefined) {
      console.error("[zap failed]", payment);
      return null;
    }
    return zapInvoice;
  } catch (error) {
    return null;
  }
}

export const getZapLNURLPubkey = async (
  metadata: Nostr.Event
): Promise<string | null> => {
  const result = await get(queryClient)?.fetchQuery({
    queryKey: ["zapLNURLPubkey", metadata.pubkey] as QueryKey,
    queryFn: () => fetchZapLNURLPubkey(metadata),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return result;
};

export async function fetchZapLNURLPubkey(
  metadata: Nostr.Event
): Promise<null | string> {
  try {
    let lnurl: string = "";
    let { lud06, lud16 } = JSON.parse(metadata.content);
    if (lud06) {
      let { words } = bech32.decode(lud06, 1000);
      let data = bech32.fromWords(words);
      lnurl = new TextDecoder().decode(data);
    } else if (lud16) {
      let [name, domain] = lud16.split("@");
      lnurl = new URL(
        `/.well-known/lnurlp/${name}`,
        `https://${domain}`
      ).toString();
    } else {
      return null;
    }

    let res = await fetch(lnurl);
    if (!res.ok) throw new Error("Network response was not ok");
    let body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.nostrPubkey;
    }
  } catch (err) {
    console.error(err);
  }

  return null;
}

export function extractKind9734(event: Nostr.Event): Nostr.Event | undefined {
  //description tag を持たなければならない
  const descriptionTag = event.tags.find((tag) => tag[0] === "description");
  if (!descriptionTag || descriptionTag.length <= 1) {
    console.log("zap descriptionTag error");
    return;
  }
  try {
    const kind9734 = JSON.parse(descriptionTag[1]);
    //kind9734の検証
    if (verifyEvent(kind9734)) {
      return kind9734;
    } else {
      console.log("zap kind9734 error");
      return;
    }
  } catch (error) {
    console.error("Error parsing description tag:", error);
    return;
  }
}
export async function getZapRelay(pubkey: string): Promise<string[]> {
  let queryRelay: EventPacket | undefined = get(queryClient).getQueryData([
    "defaultRelay",
    pubkey,
  ]);
  if (!queryRelay) {
    const relayData = await usePromiseReq(
      {
        filters: [
          {
            kinds: [10002],
            limit: 1,
            authors: [pubkey],
          },
        ],
        operator: pipe(latest(), uniq()),
        req: undefined,
      },
      undefined
    );
    if (relayData.length > 0) {
      get(queryClient).setQueryData(
        ["relays", pubkey],
        (oldData: any) => relayData[0]
      );
      queryRelay = relayData[0];
      console.log(get(queryClient).getQueryData(["relays", pubkey]));
    }
  }

  const readRelay: string[] | undefined = queryRelay?.event.tags.reduce(
    (acc: string[], tag: string[]) => {
      if (tag[0] === "r" && tag.length === 2) {
        return [...acc, tag[1].endsWith("/") ? tag[1] : `${tag[1]}/`];
      } else if (tag.length > 2 && tag[2] === "read") {
        return [...acc, tag[1].endsWith("/") ? tag[1] : `${tag[1]}/`];
      } else {
        return acc;
      }
    },
    [] // 初期値を空の配列に設定
  );

  console.log("readRelay", readRelay);
  const myRelays = getDefaultWriteRelays();
  console.log("myRelays", myRelays);
  const zapRelays = Array.from(new Set([...(readRelay ?? []), ...myRelays]));
  console.log("zapRelays", zapRelays);
  return zapRelays;
}
