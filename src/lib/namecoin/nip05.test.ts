/**
 * Pure unit tests for the Namecoin .bit NIP-05 resolver. No network.
 */
import { describe, it, expect } from "vitest";
import {
  isBitIdentifier,
  parseBitIdentifier,
  extractNostrData,
  type ParsedBitIdentifier,
} from "./nip05";
import { _internal } from "./electrumx";

const HEX64 =
  "43185edecb675892824b1a37a57f3e407fbde2eda7201a3829b8cf4ba7c5b4f0";
const HEX64_B =
  "460c25e682fda7832b52d1f22d3d22b3176d972f60dcdc3212ed8c92ef85065c";

describe("isBitIdentifier", () => {
  it("accepts user@domain.bit and bare domain.bit", () => {
    expect(isBitIdentifier("alice@example.bit")).toBe(true);
    expect(isBitIdentifier("example.bit")).toBe(true);
    expect(isBitIdentifier("_@mstrofnone.bit")).toBe(true);
    expect(isBitIdentifier("M@MSTROFNONE.BIT")).toBe(true); // case-insensitive
  });

  it("rejects regular NIP-05 domains and junk", () => {
    expect(isBitIdentifier("alice@example.com")).toBe(false);
    expect(isBitIdentifier("alice@bit.example.com")).toBe(false); // .bit only as TLD
    expect(isBitIdentifier(".bit")).toBe(false);
    expect(isBitIdentifier("")).toBe(false);
    expect(isBitIdentifier(undefined)).toBe(false);
    expect(isBitIdentifier(null)).toBe(false);
  });
});

describe("parseBitIdentifier", () => {
  it("parses alice@example.bit", () => {
    const p = parseBitIdentifier("alice@example.bit");
    expect(p).toMatchObject({
      namecoinName: "d/example",
      namespace: "d",
      name: "example",
      localPart: "alice",
    });
  });

  it("treats _ as root", () => {
    const p = parseBitIdentifier("_@mstrofnone.bit");
    expect(p?.localPart).toBeUndefined();
    expect(p?.namecoinName).toBe("d/mstrofnone");
  });

  it("parses bare example.bit as root", () => {
    const p = parseBitIdentifier("mstrofnone.bit");
    expect(p?.localPart).toBeUndefined();
    expect(p?.namecoinName).toBe("d/mstrofnone");
  });

  it("lowercases", () => {
    const p = parseBitIdentifier("Alice@Example.Bit");
    expect(p?.localPart).toBe("alice");
    expect(p?.namecoinName).toBe("d/example");
  });

  it("returns null for non-.bit input", () => {
    expect(parseBitIdentifier("alice@example.com")).toBeNull();
  });
});

describe("extractNostrData", () => {
  const rootP: ParsedBitIdentifier = {
    namecoinName: "d/example",
    namespace: "d",
    name: "example",
    raw: "example.bit",
  };
  const aliceP: ParsedBitIdentifier = {
    ...rootP,
    localPart: "alice",
    raw: "alice@example.bit",
  };

  it("handles shorthand nostr:<hex64> for root", () => {
    const r = extractNostrData({ nostr: HEX64 }, rootP);
    expect(r).toEqual({ pubkey: HEX64 });
  });

  it("rejects shorthand for non-root lookups", () => {
    expect(extractNostrData({ nostr: HEX64 }, aliceP)).toBeNull();
  });

  it("reads names directory + relays map", () => {
    const value = {
      nostr: {
        names: { _: HEX64, alice: HEX64_B },
        relays: { [HEX64_B]: ["wss://relay.testls.bit/"] },
      },
    };
    expect(extractNostrData(value, aliceP)).toEqual({
      pubkey: HEX64_B,
      relays: ["wss://relay.testls.bit/"],
    });
    expect(extractNostrData(value, rootP)).toEqual({ pubkey: HEX64 });
  });

  it("falls back to sole entry when bare domain has no _", () => {
    const value = { nostr: { names: { alice: HEX64 } } };
    expect(extractNostrData(value, rootP)).toEqual({ pubkey: HEX64 });
  });

  it("handles single-identity shape with relays array", () => {
    const value = {
      nostr: { pubkey: HEX64, relays: ["wss://relay.testls.bit/"] },
    };
    expect(extractNostrData(value, rootP)).toEqual({
      pubkey: HEX64,
      relays: ["wss://relay.testls.bit/"],
    });
  });

  it("returns null when the lookup key is missing", () => {
    const value = { nostr: { names: { _: HEX64 } } };
    expect(extractNostrData(value, aliceP)).toBeNull();
  });

  it("returns null when pubkey is malformed", () => {
    const value = { nostr: { names: { _: "not-hex" } } };
    expect(extractNostrData(value, rootP)).toBeNull();
  });

  it("ignores non-string relay entries", () => {
    const value = {
      nostr: {
        names: { _: HEX64 },
        relays: { [HEX64]: ["wss://ok/", 42, null] },
      },
    };
    expect(extractNostrData(value, rootP)).toEqual({
      pubkey: HEX64,
      relays: ["wss://ok/"],
    });
  });
});

describe("electrumx internals", () => {
  it("encodes small push data correctly", () => {
    const bytes = new TextEncoder().encode("d/example");
    const pushed = _internal.pushData(bytes);
    expect(pushed[0]).toBe(bytes.length); // direct push opcode
    expect(pushed.length).toBe(bytes.length + 1);
  });

  it("encodes empty push as OP_0 (0x00)", () => {
    const pushed = _internal.pushData(new Uint8Array(0));
    expect(Array.from(pushed)).toEqual([0x00]);
  });

  it("builds a name-index script with the expected opcodes", () => {
    const name = new TextEncoder().encode("d/mstrofnone");
    const script = _internal.buildNameIndexScript(name);
    expect(script[0]).toBe(0x53); // OP_NAME_UPDATE
    expect(script[1]).toBe(name.length); // direct push opcode for the name
    expect(script[script.length - 3]).toBe(0x6d); // OP_2DROP
    expect(script[script.length - 2]).toBe(0x75); // OP_DROP
    expect(script[script.length - 1]).toBe(0x6a); // OP_RETURN
  });

  it("parseNameFromVerboseTx pulls value out of a NAME_UPDATE output", async () => {
    // Construct: OP_NAME_UPDATE <push "d/example"> <push "{}"> rest
    const name = new TextEncoder().encode("d/example");
    const value = new TextEncoder().encode('{"nostr":"' + HEX64 + '"}');
    const namePush = _internal.pushData(name);
    const valuePush = _internal.pushData(value);
    const trailer = new Uint8Array([0x6d, 0x75, 0x6a]);
    const script = new Uint8Array(1 + namePush.length + valuePush.length + trailer.length);
    let o = 0;
    script[o++] = 0x53;
    script.set(namePush, o);
    o += namePush.length;
    script.set(valuePush, o);
    o += valuePush.length;
    script.set(trailer, o);
    const hex = Array.from(script)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const parsed = _internal.parseNameFromVerboseTx(
      { vout: [{ scriptPubKey: { hex } }] },
      "d/example"
    );
    expect(parsed?.name).toBe("d/example");
    expect(JSON.parse(parsed!.value)).toEqual({ nostr: HEX64 });
  });

  it("parseNameFromVerboseTx also accepts NAME_FIRSTUPDATE (0x52) with rand push", () => {
    // OP_NAME_FIRSTUPDATE <push name> <push rand(8)> <push value> OP_2DROP OP_2DROP OP_DROP OP_RETURN
    // The trailer bytes don't matter to the parser \u2014 it just reads three pushes.
    const name = new TextEncoder().encode("d/example");
    const rand = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const value = new TextEncoder().encode('{"nostr":"' + HEX64 + '"}');
    const namePush = _internal.pushData(name);
    const randPush = _internal.pushData(rand);
    const valuePush = _internal.pushData(value);
    const trailer = new Uint8Array([0x6d, 0x6d, 0x75, 0x6a]);
    const script = new Uint8Array(
      1 + namePush.length + randPush.length + valuePush.length + trailer.length
    );
    let o = 0;
    script[o++] = 0x52;
    script.set(namePush, o);
    o += namePush.length;
    script.set(randPush, o);
    o += randPush.length;
    script.set(valuePush, o);
    o += valuePush.length;
    script.set(trailer, o);
    const hex = Array.from(script)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const parsed = _internal.parseNameFromVerboseTx(
      { vout: [{ scriptPubKey: { hex } }] },
      "d/example"
    );
    expect(parsed?.name).toBe("d/example");
    expect(JSON.parse(parsed!.value)).toEqual({ nostr: HEX64 });
  });
});
