import { verifyEvent, type EventTemplate } from "nostr-tools";
import * as Nostr from "nostr-typedef";
import { getDefaultWriteRelays, usePromiseReq } from "./nostr";
import { bech32 } from "@scure/base";
import { type QueryKey } from "@tanstack/svelte-query";

import { queryClient } from "$lib/stores/stores";
import { latest, uniq, type EventPacket } from "rx-nostr";
import { pipe } from "rxjs";
import { decode } from "light-bolt11-decoder";
import { normalizeURL, utf8Decoder } from "nostr-tools/utils";

export interface InvoiceProp {
  metadata: Nostr.Event;
  eventTag?: string[];
  amount: number;
  comment: string;
  zapRelays: string[];
  kind?: number;
}
export async function makeInvoice({
  metadata,
  eventTag,
  amount, //1000かけたやつをいれる
  comment,
  zapRelays,
  kind,
}: InvoiceProp): Promise<string | null> {
  try {
    const zapEndpoint = await getZapEndpoint(metadata);
    console.log(zapEndpoint);
    if (!zapEndpoint) {
      return null;
    }

    const zapRequest: EventTemplate = makeZapRequest({
      profile: metadata.pubkey,
      eventTag: eventTag ?? null,
      amount: amount,
      relays: zapRelays,
      comment: comment,
      ...(kind !== undefined ? { kind } : {}),
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
): Promise<{ pub: string | undefined; error?: string }> => {
  const data: { pub: string | undefined; error?: string } | undefined =
    queryClient.getQueryData(["zapLNURLPubkey", metadata.pubkey]);
  if (data) {
    return data;
  }
  const result = await queryClient.fetchQuery({
    queryKey: ["zapLNURLPubkey", metadata.pubkey] as QueryKey,
    queryFn: () => fetchZapLNURLPubkey(metadata),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return result;
};

export async function fetchZapLNURLPubkey(
  metadata: Nostr.Event
): Promise<{ pub: string | undefined; error?: string }> {
  try {
    let lnurl: string = "";
    let { lud06, lud16 } = JSON.parse(metadata.content);

    //lud16( name@domain )優先
    if (lud16) {
      const [name, domain] = lud16.split("@");
      lnurl = new URL(
        `/.well-known/lnurlp/${name}`,
        `https://${domain}`
      ).toString();
    } else if (lud06) {
      const { words } = bech32.decode(lud06, 1000);
      const data = bech32.fromWords(words);
      lnurl = new TextDecoder().decode(data);
    } else {
      return {
        pub: undefined,
        error: "Failed to retrieve the zapped user's LNURL.",
      };
    }

    const body = await getNurlFetch(lnurl);
    if (!body) {
      return { pub: undefined, error: `Failed to fetch from ${lnurl}` };
    }

    if (body.allowsNostr && body.nostrPubkey) {
      return { pub: body.nostrPubkey };
    } else {
      return {
        pub: undefined,
        error: !body.allowsNostr
          ? "Error in the allowsNostr field of the LNURL Server."
          : "The nostrPubkey field of the LNURL Server is not set.",
      };
    }
  } catch (err) {
    return {
      pub: undefined,
      error: "An error occurred while fetching LNURL data.",
    };
  }
}

export async function getNurlFetch(lnurl: string): Promise<any | undefined> {
  const data: Response | undefined = queryClient?.getQueryData([
    "fetchNnurl",
    lnurl,
  ]);
  if (data) return data;

  try {
    const response = await queryClient?.fetchQuery({
      queryKey: ["fetchNnurl", lnurl] as QueryKey,
      queryFn: async () => {
        const res = await fetch(lnurl);
        if (!res.ok) throw new Error(`Failed to fetch from ${lnurl}`);
        return await res?.json();
      },
      staleTime: Infinity,
      gcTime: Infinity,
    });
    return response;
  } catch (error: any) {
    console.error("Fetch error:", error);
    return undefined;
  }
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
  let queryRelay: EventPacket | undefined = queryClient.getQueryData([
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
      queryClient.setQueryData(
        ["relays", pubkey],
        (oldData: any) => relayData[0]
      );
      queryRelay = relayData[0];
      console.log(queryClient.getQueryData(["relays", pubkey]));
    }
  }

  const readRelay: string[] | undefined = queryRelay?.event?.tags?.reduce(
    (acc: string[], tag: string[]) => {
      try {
        if (tag[0] === "r" && tag.length === 2) {
          return [...acc, normalizeURL(tag[1])];
        } else if (tag.length > 2 && tag[2] === "read") {
          return [...acc, normalizeURL(tag[1])];
        } else {
          return acc;
        }
      } catch (error) {
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

//https://scrapbox.io/nostr/NIP-57
export function extractAmount(
  note: Nostr.Event,
  zapRequestEvent: Nostr.Event | undefined
): number | undefined {
  //bolt11 tag を持たなければならない
  const bolt11Tag = note.tags.find((tag) => tag[0] === "bolt11");
  //console.log(bolt11Tag);
  if (!bolt11Tag || bolt11Tag.length <= 1) {
    console.log("zap bolt11Tag error");
    return;
  }
  try {
    const decoded = decode(bolt11Tag[1]);
    //console.log(decoded);
    if (decoded) {
      const amountSection = decoded.sections.find(
        (section) => section.name === "amount"
      )?.value;
      //  console.log("zapRequestEvent", zapRequestEvent);
      // console.log("amountSection", amountSection);

      const requestAmount = zapRequestEvent?.tags.find(
        (tag) => tag[0] === "amount"
      )?.[1];
      // console.log("requestAmount", requestAmount);
      //`zapレシート`の`bolt11`タグに含まれる`invoiceAmount`は（存在する場合には）`zapリクエスト`の`amount`タグと等しくなければならない
      //https://github.com/nostr-protocol/nips/blob/master/57.md
      //ある場合にのみイコールなのが必須
      if (requestAmount) {
        if (amountSection !== requestAmount) {
          console.log("zap amount error", amountSection, requestAmount);
          return undefined;
        }
      }
      //amountSectionの値がザップの値
      if (amountSection) {
        return Math.floor(Number(amountSection) / 1000);
      }
    }
  } catch (error) {
    console.error("Error decoding bolt11 tag:", error);
    return;
  }
}

export function makeZapRequest({
  profile,
  eventTag,
  amount,
  relays,
  comment = "",
  kind,
}: {
  profile: string;
  eventTag: string[] | null;
  amount: number;
  comment: string;
  relays: string[];
  kind?: number;
}): EventTemplate {
  if (!amount) throw new Error("amount not given");
  if (!profile) throw new Error("profile not given");

  let zr: EventTemplate = {
    kind: 9734,
    created_at: Math.round(Date.now() / 1000),
    content: comment,
    tags: [
      ["p", profile],
      ["amount", amount.toString()],
      ["relays", ...relays],
      ...(kind !== undefined ? [["k", kind.toString()]] : []),
    ],
  };

  if (eventTag) {
    zr.tags.push(eventTag);
  }

  return zr;
}

export function lnurlToZapAddress(lud06: string): string | undefined {
  try {
    const { words } = bech32.decode(lud06 as `${string}1${string}`, 1000);
    const data = bech32.fromWords(words);
    const lnurl = new TextDecoder().decode(data);

    const match = lnurl.match(
      /^https:\/\/([^\/]+)\/\.well-known\/lnurlp\/([^\/]+)$/
    );

    if (match && match.length >= 3) {
      const domain = match[1];
      const username = match[2];
      return `${username}@${domain}`;
    }

    return undefined;
  } catch (error) {
    // console.error("Invalid LNURL:", error);
    return undefined;
  }
}

//https://github.com/nbd-wtf/nostr-tools/blob/master/nip57.ts
//lud16( name@domain )優先
export async function getZapEndpoint(
  metadata: Nostr.Event
): Promise<null | string> {
  try {
    let lnurl: string = "";
    let { lud06, lud16 } = JSON.parse(metadata.content);

    if (lud16) {
      let [name, domain] = lud16.split("@");
      lnurl = new URL(
        `/.well-known/lnurlp/${name}`,
        `https://${domain}`
      ).toString();
    } else if (lud06) {
      let { words } = bech32.decode(lud06, 1000);
      let data = bech32.fromWords(words);
      lnurl = utf8Decoder.decode(data);
    } else {
      return null;
    }

    let body = await getNurlFetch(lnurl);

    if (body && body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch (err) {
    /*-*/
  }

  return null;
}
