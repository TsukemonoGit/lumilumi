/**
 * Browser-native ElectrumX WebSocket client for Namecoin name resolution.
 *
 * Connects directly from the browser to ElectrumX servers over WSS — no
 * backend proxy or server-side code needed. ElectrumX 1.16.0+ with the
 * Namecoin patches + websockets transport is required on the server side.
 *
 * Resolution strategy:
 *   1. Build a canonical name-index script for the identifier
 *   2. Compute the Electrum-style scripthash (reversed SHA-256)
 *   3. Query blockchain.scripthash.get_history to find the latest tx
 *   4. Fetch the verbose transaction and parse the name value from its script
 *   5. Check current block height for expiry (36000-block window)
 *
 * Wire format is identical to the merged Amethyst, Nostur, dart-nostr and
 * nostrudel implementations of Namecoin NIP-05.
 */
import { DEFAULT_ELECTRUMX_SERVERS, NAME_EXPIRE_DEPTH, type ElectrumxServer } from "./constants";

// OP codes for Namecoin name scripts
const OP_NAME_UPDATE = 0x53;
const OP_2DROP = 0x6d;
const OP_DROP = 0x75;
const OP_RETURN = 0x6a;

// ── Crypto helpers (Web Crypto API) ─────────────────────────────────

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "crypto.subtle unavailable (insecure context?). Use https:// or localhost."
    );
  }
  const hash = await globalThis.crypto.subtle.digest(
    "SHA-256",
    data as ArrayBufferView<ArrayBuffer>
  );
  return new Uint8Array(hash);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const len = hex.length;
  const arr = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

// ── Script building ─────────────────────────────────────────────────

/** Bitcoin-style push-data encoding */
function pushData(data: Uint8Array): Uint8Array {
  const len = data.length;
  if (len === 0) return new Uint8Array([0x00]); // OP_0
  if (len < 0x4c) {
    const result = new Uint8Array(1 + len);
    result[0] = len;
    result.set(data, 1);
    return result;
  }
  if (len <= 0xff) {
    const result = new Uint8Array(2 + len);
    result[0] = 0x4c; // OP_PUSHDATA1
    result[1] = len;
    result.set(data, 2);
    return result;
  }
  const result = new Uint8Array(3 + len);
  result[0] = 0x4d; // OP_PUSHDATA2
  result[1] = len & 0xff;
  result[2] = (len >> 8) & 0xff;
  result.set(data, 3);
  return result;
}

/**
 * Build the canonical name-index script:
 *   OP_NAME_UPDATE <push(name)> <push(empty)> OP_2DROP OP_DROP OP_RETURN
 *
 * This is the pattern indexed by the Namecoin-patched ElectrumX fork
 * (electrumx/lib/coins.py: NamecoinMixin.build_name_index_script).
 */
function buildNameIndexScript(nameBytes: Uint8Array): Uint8Array {
  const namePush = pushData(nameBytes);
  const emptyPush = pushData(new Uint8Array(0));
  const result = new Uint8Array(1 + namePush.length + emptyPush.length + 3);
  let o = 0;
  result[o++] = OP_NAME_UPDATE;
  result.set(namePush, o);
  o += namePush.length;
  result.set(emptyPush, o);
  o += emptyPush.length;
  result[o++] = OP_2DROP;
  result[o++] = OP_DROP;
  result[o++] = OP_RETURN;
  return result;
}

async function electrumScripthash(script: Uint8Array): Promise<string> {
  const hash = await sha256(script);
  hash.reverse();
  return toHex(hash);
}

// ── Transaction parsing ─────────────────────────────────────────────

function readPushData(
  script: Uint8Array,
  pos: number
): { data: Uint8Array; next: number } | null {
  if (pos >= script.length) return null;
  const op = script[pos];
  if (op === 0x00) return { data: new Uint8Array(0), next: pos + 1 };
  if (op >= 0x01 && op <= 0x4b) {
    const end = pos + 1 + op;
    if (end > script.length) return null;
    return { data: script.slice(pos + 1, end), next: end };
  }
  if (op === 0x4c) {
    if (pos + 2 > script.length) return null;
    const len = script[pos + 1];
    const end = pos + 2 + len;
    if (end > script.length) return null;
    return { data: script.slice(pos + 2, end), next: end };
  }
  if (op === 0x4d) {
    if (pos + 3 > script.length) return null;
    const len = script[pos + 1] | (script[pos + 2] << 8);
    const end = pos + 3 + len;
    if (end > script.length) return null;
    return { data: script.slice(pos + 3, end), next: end };
  }
  return null;
}

interface VerboseTxResult {
  vout?: Array<{ scriptPubKey?: { hex?: string } }>;
}

/**
 * Extract the name value from a verbose transaction.
 * Accepts NAME_UPDATE (0x53) and NAME_FIRSTUPDATE (0x52) outputs so names in
 * their first-update window are not silently treated as missing.
 */
function parseNameFromVerboseTx(
  tx: VerboseTxResult,
  expectedName: string
): { name: string; value: string } | null {
  const nameBytes = new TextEncoder().encode(expectedName);
  for (const vout of tx.vout || []) {
    const hex = vout.scriptPubKey?.hex;
    if (!hex) continue;
    const script = hexToBytes(hex);
    const op = script[0];
    // 0x53 = OP_NAME_UPDATE, 0x52 = OP_NAME_FIRSTUPDATE
    if (op !== 0x53 && op !== 0x52) continue;

    const namePushed = readPushData(script, 1);
    if (!namePushed) continue;
    if (namePushed.data.length !== nameBytes.length) continue;
    let match = true;
    for (let i = 0; i < nameBytes.length; i++) {
      if (namePushed.data[i] !== nameBytes[i]) {
        match = false;
        break;
      }
    }
    if (!match) continue;

    let cursor = namePushed.next;
    // NAME_FIRSTUPDATE has an extra <rand> push between <name> and <value>.
    if (op === 0x52) {
      const skip = readPushData(script, cursor);
      if (!skip) continue;
      cursor = skip.next;
    }
    const valuePushed = readPushData(script, cursor);
    if (!valuePushed) continue;

    return {
      name: new TextDecoder("ascii").decode(namePushed.data),
      value: new TextDecoder("utf-8").decode(valuePushed.data),
    };
  }
  return null;
}

// ── WebSocket JSON-RPC ──────────────────────────────────────────────

interface RpcResponse {
  jsonrpc?: string;
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * Run a batch of JSON-RPC calls over a single WebSocket connection.
 * Calls are sent sequentially after each response arrives.
 */
export function wsRpcBatch(
  url: string,
  calls: Array<{ method: string; params: unknown[] }>,
  timeoutMs = 20000
): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const results: unknown[] = [];
    let callIndex = 0;
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      reject(new Error(`WebSocket batch timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    function sendNext() {
      const { method, params } = calls[callIndex];
      ws.send(
        JSON.stringify({ jsonrpc: "2.0", method, params, id: callIndex + 1 }) + "\n"
      );
    }

    ws.addEventListener("open", () => sendNext());

    ws.addEventListener("message", (ev: MessageEvent) => {
      if (settled) return;
      try {
        const data = typeof ev.data === "string" ? ev.data : String(ev.data);
        // Some ElectrumX servers send multiple JSON-RPC messages back to
        // back, separated by newlines.
        for (const line of data.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || settled) continue;
          const msg = JSON.parse(trimmed) as RpcResponse & { method?: string };
          // ElectrumX is bidirectional JSON-RPC: the server initiates its
          // own RPC requests at us (blockchain.relayfee, blockchain.estimatefee
          // etc.) which arrive as `{ method, params, id? }` with no `result`.
          // Ignore anything that isn't a response to our outstanding call.
          if (msg.id !== callIndex + 1) continue;
          if (msg.error) {
            settled = true;
            clearTimeout(timer);
            ws.close();
            reject(
              new Error(msg.error.message || `RPC error ${msg.error.code}`)
            );
            return;
          }
          results.push(msg.result);
          callIndex++;
          if (callIndex >= calls.length) {
            settled = true;
            clearTimeout(timer);
            ws.close();
            resolve(results);
            return;
          }
          sendNext();
        }
      } catch (err) {
        settled = true;
        clearTimeout(timer);
        ws.close();
        reject(err);
      }
    });

    ws.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`WebSocket connection failed: ${url}`));
    });

    ws.addEventListener("close", (ev: CloseEvent) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`WebSocket closed unexpectedly: code=${ev.code}`));
    });
  });
}

// ── Public API ──────────────────────────────────────────────────────

export interface NameShowResult {
  /** The Namecoin name (e.g. "d/example") */
  name: string;
  /** The current value (JSON string) */
  value: string;
  /** Transaction id of the latest name op */
  txid: string;
  /** Block height of the latest name op */
  height: number;
  /** Whether the name has expired */
  expired: boolean;
}

/**
 * Resolve a Namecoin name via WSS to an ElectrumX server.
 *
 * Returns null if the name doesn't exist or has no value.
 * Returns `{ expired: true, value: "" }` if the name has lapsed.
 * Throws on connection/protocol failure.
 */
export async function nameShowWs(
  fullName: string,
  serverUrl: string
): Promise<NameShowResult | null> {
  const nameBytes = new TextEncoder().encode(fullName);
  const script = buildNameIndexScript(nameBytes);
  const scripthash = await electrumScripthash(script);

  // ElectrumX requires `server.version` negotiation before responding to
  // any other call. Two batches — the first negotiates + fetches history,
  // the second (only if we need it) re-negotiates and fetches tx+tip.
  const batch1 = (await wsRpcBatch(serverUrl, [
    { method: "server.version", params: ["lumilumi/0.1", "1.4"] },
    { method: "blockchain.scripthash.get_history", params: [scripthash] },
  ])) as [unknown, Array<{ tx_hash: string; height: number }>];

  const history = batch1[1];
  if (!history || !history.length) return null;
  const latest = history.reduce((a, b) => (a.height > b.height ? a : b));

  const batch2 = (await wsRpcBatch(serverUrl, [
    { method: "server.version", params: ["lumilumi/0.1", "1.4"] },
    { method: "blockchain.transaction.get", params: [latest.tx_hash, true] },
    { method: "blockchain.headers.subscribe", params: [] },
  ])) as [unknown, VerboseTxResult, { height?: number; block_height?: number }];

  const tx = batch2[1];
  const tip = batch2[2]?.height ?? batch2[2]?.block_height ?? 0;

  const expired =
    tip > 0 && latest.height > 0 && tip - latest.height >= NAME_EXPIRE_DEPTH;
  if (expired) {
    return {
      name: fullName,
      value: "",
      txid: latest.tx_hash,
      height: latest.height,
      expired: true,
    };
  }

  const parsed = parseNameFromVerboseTx(tx, fullName);
  if (!parsed) return null;

  return {
    name: parsed.name,
    value: parsed.value,
    txid: latest.tx_hash,
    height: latest.height,
    expired: false,
  };
}

/** Try each configured server in order until one succeeds. */
export async function nameShowWithFallback(
  fullName: string,
  servers: ElectrumxServer[] = DEFAULT_ELECTRUMX_SERVERS
): Promise<NameShowResult | null> {
  let lastErr: Error | null = null;
  for (const server of servers) {
    try {
      return await nameShowWs(fullName, server.url);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      // eslint-disable-next-line no-console
      console.warn(`[namecoin] server ${server.label} failed:`, lastErr.message);
    }
  }
  throw lastErr ?? new Error("All ElectrumX servers unreachable");
}

// Test-only exports
export const _internal = {
  buildNameIndexScript,
  electrumScripthash,
  parseNameFromVerboseTx,
  readPushData,
  pushData,
};
