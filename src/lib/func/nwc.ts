// NIP-47 Nostr Wallet Connect
// https://github.com/nostr-protocol/nips/blob/master/47.md
//
// 接続URIはウォレットを操作できる秘密鍵を含むので、lumiSetting には入れない。
// lumiSetting は kind:30078 で平文のままリレーに公開されるため、
// ここでは専用のキーで localStorage にだけ保存する（この端末のみ）。
import { finalizeEvent, getPublicKey, type VerifiedEvent } from "nostr-tools/pure";
import { Relay } from "nostr-tools/relay";
import * as nip04 from "nostr-tools/nip04";
import * as nip44 from "nostr-tools/nip44";
import { hexToBytes } from "nostr-tools/utils";
import * as Nostr from "nostr-typedef";
import { STORAGE_KEYS } from "./localStorageKeys";

export const NWC_INFO_KIND = 13194;
export const NWC_REQUEST_KIND = 23194;
export const NWC_RESPONSE_KIND = 23195;

export type NwcEncryption = "nip44_v2" | "nip04";

export interface NwcConnection {
  walletPubkey: string;
  relays: string[];
  secret: string;
  lud16?: string;
}

const HEX64 = /^[0-9a-f]{64}$/;

export function parseNwcUri(uri: string): NwcConnection {
  const trimmed = uri.trim();
  const match = trimmed.match(/^nostr\+walletconnect:(?:\/\/)?([^?]+)\?(.*)$/i);
  if (!match) {
    throw new Error("Invalid NWC URI");
  }
  const walletPubkey = match[1].toLowerCase();
  const params = new URLSearchParams(match[2]);
  const relays = params.getAll("relay").filter((r) => /^wss?:\/\//.test(r));
  const secret = (params.get("secret") ?? "").toLowerCase();
  if (!HEX64.test(walletPubkey) || !HEX64.test(secret) || relays.length === 0) {
    throw new Error("Invalid NWC URI");
  }
  const lud16 = params.get("lud16") ?? undefined;
  return { walletPubkey, relays, secret, ...(lud16 ? { lud16 } : {}) };
}

export function loadNwcUri(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.NWC);
  } catch {
    return null;
  }
}

export function saveNwcUri(uri: string) {
  parseNwcUri(uri);
  localStorage.setItem(STORAGE_KEYS.NWC, uri.trim());
}

export function clearNwcUri() {
  localStorage.removeItem(STORAGE_KEYS.NWC);
}

// info イベント(kind:13194)の encryption タグを見る。タグが無いウォレットは nip04 のみ
export function pickEncryption(
  info: Pick<Nostr.Event, "tags"> | undefined,
): NwcEncryption {
  const tag = info?.tags.find((t) => t[0] === "encryption");
  if (tag && tag[1]?.split(" ").includes("nip44_v2")) {
    return "nip44_v2";
  }
  return "nip04";
}

export function encryptFor(
  conn: NwcConnection,
  plaintext: string,
  encryption: NwcEncryption,
): string {
  const sk = hexToBytes(conn.secret);
  if (encryption === "nip44_v2") {
    return nip44.encrypt(
      plaintext,
      nip44.getConversationKey(sk, conn.walletPubkey),
    );
  }
  return nip04.encrypt(sk, conn.walletPubkey, plaintext);
}

// nip04 の暗号文は "?iv=" を含むので、形で判別する
export function decryptFrom(conn: NwcConnection, content: string): string {
  const sk = hexToBytes(conn.secret);
  if (content.includes("?iv=")) {
    return nip04.decrypt(sk, conn.walletPubkey, content);
  }
  return nip44.decrypt(content, nip44.getConversationKey(sk, conn.walletPubkey));
}

export function makePayInvoiceRequest(
  conn: NwcConnection,
  invoice: string,
  encryption: NwcEncryption,
  created_at = Math.floor(Date.now() / 1000),
): VerifiedEvent {
  const content = encryptFor(
    conn,
    JSON.stringify({ method: "pay_invoice", params: { invoice } }),
    encryption,
  );
  const tags = [["p", conn.walletPubkey]];
  if (encryption === "nip44_v2") {
    tags.push(["encryption", "nip44_v2"]);
  }
  return finalizeEvent(
    { kind: NWC_REQUEST_KIND, created_at, tags, content },
    hexToBytes(conn.secret),
  );
}

export interface NwcPayResult {
  preimage: string;
}

export function readPayInvoiceResponse(
  conn: NwcConnection,
  event: Pick<Nostr.Event, "content">,
): NwcPayResult {
  const res = JSON.parse(decryptFrom(conn, event.content));
  if (res.error) {
    throw new Error(
      `${res.error.code ?? "ERROR"}: ${res.error.message ?? "payment failed"}`,
    );
  }
  if (!res.result?.preimage) {
    throw new Error("No preimage in NWC response");
  }
  return { preimage: res.result.preimage };
}

function fetchInfo(relay: Relay, conn: NwcConnection, timeoutMs = 5000) {
  return new Promise<Nostr.Event | undefined>((resolve) => {
    let info: Nostr.Event | undefined;
    const sub = relay.subscribe(
      [{ kinds: [NWC_INFO_KIND], authors: [conn.walletPubkey], limit: 1 }],
      {
        onevent(ev) {
          info = ev as Nostr.Event;
        },
        oneose() {
          sub.close();
          resolve(info);
        },
      },
    );
    setTimeout(() => {
      sub.close();
      resolve(info);
    }, timeoutMs);
  });
}

export async function payInvoice(
  uri: string,
  invoice: string,
  timeoutMs = 60000,
): Promise<NwcPayResult> {
  const conn = parseNwcUri(uri);
  const relay = await Relay.connect(conn.relays[0], {});
  try {
    const encryption = pickEncryption(await fetchInfo(relay, conn));
    const request = makePayInvoiceRequest(conn, invoice, encryption);
    const clientPubkey = getPublicKey(hexToBytes(conn.secret));

    return await new Promise<NwcPayResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        sub.close();
        reject(new Error("NWC timeout"));
      }, timeoutMs);
      // 応答を取りこぼさないよう、publish より先に購読する
      const sub = relay.subscribe(
        [
          {
            kinds: [NWC_RESPONSE_KIND],
            authors: [conn.walletPubkey],
            "#p": [clientPubkey],
            "#e": [request.id],
          },
        ],
        {
          onevent(ev) {
            clearTimeout(timer);
            sub.close();
            try {
              resolve(readPayInvoiceResponse(conn, ev));
            } catch (e) {
              reject(e);
            }
          },
        },
      );
      relay.publish(request).catch((e) => {
        clearTimeout(timer);
        sub.close();
        reject(e);
      });
    });
  } finally {
    relay.close();
  }
}
