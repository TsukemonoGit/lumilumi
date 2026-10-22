import { describe, expect, test } from "vitest";
import { generateSecretKey, getPublicKey, verifyEvent } from "nostr-tools/pure";
import * as nip04 from "nostr-tools/nip04";
import * as nip44 from "nostr-tools/nip44";
import { bytesToHex } from "nostr-tools/utils";
import {
  makePayInvoiceRequest,
  parseNwcUri,
  pickEncryption,
  readPayInvoiceResponse,
  NWC_REQUEST_KIND,
} from "./nwc";

const walletSk = generateSecretKey();
const walletPubkey = getPublicKey(walletSk);
const clientSk = generateSecretKey();
const clientPubkey = getPublicKey(clientSk);
const secret = bytesToHex(clientSk);
const uri = `nostr+walletconnect://${walletPubkey}?relay=wss%3A%2F%2Frelay.example.com&relay=wss://relay2.example.com&secret=${secret}&lud16=me@example.com`;

describe("parseNwcUri", () => {
  test("parses relays, secret and lud16", () => {
    const conn = parseNwcUri(uri);
    expect(conn.walletPubkey).toBe(walletPubkey);
    expect(conn.relays).toEqual([
      "wss://relay.example.com",
      "wss://relay2.example.com",
    ]);
    expect(conn.secret).toBe(secret);
    expect(conn.lud16).toBe("me@example.com");
  });

  test("accepts the form without //", () => {
    const conn = parseNwcUri(uri.replace("://", ":"));
    expect(conn.walletPubkey).toBe(walletPubkey);
  });

  test.each([
    "",
    "lightning:lnbc1",
    `nostr+walletconnect://${walletPubkey}?secret=${secret}`,
    `nostr+walletconnect://${walletPubkey}?relay=wss://r.example.com`,
    `nostr+walletconnect://nothex?relay=wss://r.example.com&secret=${secret}`,
  ])("rejects %s", (bad) => {
    expect(() => parseNwcUri(bad)).toThrow();
  });
});

describe("pickEncryption", () => {
  test("nip44_v2 when the wallet advertises it", () => {
    expect(pickEncryption({ tags: [["encryption", "nip44_v2 nip04"]] })).toBe(
      "nip44_v2",
    );
  });
  test("nip04 when there is no encryption tag or no info event", () => {
    expect(pickEncryption({ tags: [] })).toBe("nip04");
    expect(pickEncryption(undefined)).toBe("nip04");
  });
});

describe("pay_invoice round trip", () => {
  const conn = parseNwcUri(uri);

  test("nip44_v2 request is signed by the connection key and readable by the wallet", () => {
    const ev = makePayInvoiceRequest(conn, "lnbc1test", "nip44_v2");
    expect(verifyEvent(ev)).toBe(true);
    expect(ev.kind).toBe(NWC_REQUEST_KIND);
    expect(ev.pubkey).toBe(clientPubkey);
    expect(ev.tags).toContainEqual(["p", walletPubkey]);
    expect(ev.tags).toContainEqual(["encryption", "nip44_v2"]);
    const body = JSON.parse(
      nip44.decrypt(ev.content, nip44.getConversationKey(walletSk, clientPubkey)),
    );
    expect(body).toEqual({
      method: "pay_invoice",
      params: { invoice: "lnbc1test" },
    });
  });

  test("nip04 request has no encryption tag", () => {
    const ev = makePayInvoiceRequest(conn, "lnbc1test", "nip04");
    expect(ev.tags.find((t) => t[0] === "encryption")).toBeUndefined();
    const body = JSON.parse(nip04.decrypt(walletSk, clientPubkey, ev.content));
    expect(body.params.invoice).toBe("lnbc1test");
  });

  const ok = JSON.stringify({
    result_type: "pay_invoice",
    result: { preimage: "ab".repeat(32) },
  });

  test("reads a nip44_v2 response", () => {
    const content = nip44.encrypt(
      ok,
      nip44.getConversationKey(walletSk, clientPubkey),
    );
    expect(readPayInvoiceResponse(conn, { content }).preimage).toBe(
      "ab".repeat(32),
    );
  });

  test("reads a nip04 response", () => {
    const content = nip04.encrypt(walletSk, clientPubkey, ok);
    expect(readPayInvoiceResponse(conn, { content }).preimage).toBe(
      "ab".repeat(32),
    );
  });

  test("throws the wallet's error", () => {
    const content = nip04.encrypt(
      walletSk,
      clientPubkey,
      JSON.stringify({
        result_type: "pay_invoice",
        error: { code: "INSUFFICIENT_BALANCE", message: "not enough" },
      }),
    );
    expect(() => readPayInvoiceResponse(conn, { content })).toThrow(
      "INSUFFICIENT_BALANCE: not enough",
    );
  });
});
