import type { EventTemplate } from "nostr-tools";
import { getZapEndpoint, makeZapRequest } from "nostr-tools/nip57";
import * as Nostr from "nostr-typedef";
import { getDefaultWriteRelays } from "./nostr";
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
