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
import { decode } from "light-bolt11-decoder";

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

    if (lud06) {
      const { words } = bech32.decode(lud06, 1000);
      const data = bech32.fromWords(words);
      lnurl = new TextDecoder().decode(data);
    } else if (lud16) {
      const [name, domain] = lud16.split("@");
      lnurl = new URL(
        `/.well-known/lnurlp/${name}`,
        `https://${domain}`
      ).toString();
    } else {
      return {
        pub: undefined,
        error: "Failed to retrieve the zapped user's LNURL.",
      };
    }

    const res = await getNurlFetch(lnurl);
    if (!res) {
      return { pub: undefined, error: `Failed to fetch from ${lnurl}` };
    }

    const body = await res.json();
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

async function getNurlFetch(lnurl: string): Promise<Response | undefined> {
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
        return res;
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
