import type { EventTemplate } from "nostr-tools";
import { getZapEndpoint, makeZapRequest } from "nostr-tools/nip57";
import * as Nostr from "nostr-typedef";
import { getDefaultWriteRelays } from "./nostr";
import { bech32 } from "@scure/base";
import { type QueryKey } from "@tanstack/svelte-query";
import { get } from "svelte/store";
import { loginUser, queryClient } from "$lib/stores/stores";
import { verifyEvent } from "nostr-tools";
import { decode } from "light-bolt11-decoder";
import type { EventPacket } from "rx-nostr";

export interface InvoiceProp {
  metadata: Nostr.Event;
  id?: string;
  amount: number;
  comment: string;
}
export async function makeInvoice({
  metadata,
  id,
  amount, //1000かけたやつをいれる
  comment,
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
      relays: getDefaultWriteRelays(),
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
