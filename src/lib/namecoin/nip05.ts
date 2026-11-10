/**
 * Namecoin NIP-05 resolver.
 *
 * Recognises NIP-05 identifiers whose domain part ends in `.bit` and
 * resolves the underlying Namecoin `d/<name>` record over a browser
 * WebSocket to ElectrumX, returning a pubkey (and optional relay list) that
 * the regular NIP-05 verification path can use in place of an HTTPS fetch.
 *
 * Wire format mirrors the merged Amethyst (Kotlin), Nostur (Swift),
 * dart-nostr (Dart) and in-review nostrudel / nostr-tools (TypeScript)
 * implementations.
 */
import { nameShowWithFallback } from "./electrumx";
import { cacheGet, cacheSet } from "./cache";

/** Hard cap on `import` chain depth, matches the reference implementations. */
const MAX_IMPORT_DEPTH = 4;

export interface NamecoinNip05Result {
  /** 64-char lowercase hex pubkey. */
  pubkey: string;
  /** Optional relay hint list from the Namecoin record. */
  relays?: string[];
}

export interface ParsedBitIdentifier {
  /** Full Namecoin name, e.g. `d/example`. */
  namecoinName: string;
  /** Always `"d"` for `.bit` identifiers (`id/...` is out of scope here). */
  namespace: "d";
  /** Bare name within the namespace. */
  name: string;
  /** Local part of an `alice@example.bit` form, `undefined` for root. */
  localPart?: string;
  /** Original identifier as supplied. */
  raw: string;
}

/** Does this look like a `.bit` NIP-05 identifier? */
export function isBitIdentifier(addr: string | undefined | null): boolean {
  if (!addr) return false;
  const lower = addr.toLowerCase();
  // domain part must end with .bit
  const at = lower.lastIndexOf("@");
  const domain = at === -1 ? lower : lower.slice(at + 1);
  return domain.endsWith(".bit") && domain.length > 4;
}

/**
 * Parse a `.bit` NIP-05 address into its components.
 * Returns `null` if the address is malformed or not a `.bit` identifier.
 */
export function parseBitIdentifier(addr: string): ParsedBitIdentifier | null {
  if (!addr) return null;
  const input = addr.trim();
  if (!isBitIdentifier(input)) return null;

  const lower = input.toLowerCase();
  const at = lower.indexOf("@");
  let localPart: string | undefined;
  let domain: string;
  if (at !== -1) {
    localPart = lower.slice(0, at);
    domain = lower.slice(at + 1);
  } else {
    domain = lower;
  }

  // strip ".bit"
  const name = domain.slice(0, -4);
  if (!name) return null;
  // NIP-05 convention: "_" means root.
  if (localPart === "_" || localPart === "") localPart = undefined;

  return {
    namecoinName: `d/${name}`,
    namespace: "d",
    name,
    localPart,
    raw: addr,
  };
}

function isHexPubkey(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{64}$/.test(s);
}

/**
 * Extract pubkey + optional relays from a parsed Namecoin record value.
 *
 * Supported shapes (per the deployed wire format):
 *   {"nostr":"<hex64>"}                            // shorthand, root only
 *   {"nostr":{"names":{"_":"<hex64>","alice":"<hex64>"},
 *             "relays":{"<hex64>":["wss://..."]}}}
 *   {"nostr":{"pubkey":"<hex64>","relays":[...]}}  // d/-namespace single-id form
 */
export function extractNostrData(
  value: Record<string, unknown>,
  parsed: ParsedBitIdentifier
): NamecoinNip05Result | null {
  const nostr = value.nostr;
  if (!nostr) return null;

  // Shorthand `nostr: "<hex64>"` — only valid for the root identity.
  if (isHexPubkey(nostr)) {
    if (!parsed.localPart) return { pubkey: nostr };
    return null;
  }

  if (typeof nostr !== "object" || nostr === null) return null;
  const obj = nostr as Record<string, unknown>;

  // Single-identity form: { pubkey, relays }.
  if (isHexPubkey(obj.pubkey)) {
    if (parsed.localPart) return null; // no localPart support for this shape
    const relays = Array.isArray(obj.relays)
      ? (obj.relays as unknown[]).filter((r): r is string => typeof r === "string")
      : undefined;
    return { pubkey: obj.pubkey, relays: relays?.length ? relays : undefined };
  }

  // Directory form: { names: { _ | localPart -> hex }, relays?: {...} }
  const names = obj.names;
  if (!names || typeof names !== "object") return null;
  const namesMap = names as Record<string, unknown>;

  const lookupKey = parsed.localPart ?? "_";
  let pubkey = namesMap[lookupKey];

  // Bare domain with no `_` entry but exactly one registered name → use it.
  if (!isHexPubkey(pubkey) && !parsed.localPart) {
    const entries = Object.entries(namesMap).filter(([, v]) => isHexPubkey(v));
    if (entries.length === 1) pubkey = entries[0][1];
  }
  if (!isHexPubkey(pubkey)) return null;

  const relaysMap = obj.relays;
  let relays: string[] | undefined;
  if (relaysMap && typeof relaysMap === "object") {
    const r = (relaysMap as Record<string, unknown>)[pubkey];
    if (Array.isArray(r)) {
      relays = r.filter((x): x is string => typeof x === "string");
      if (!relays.length) relays = undefined;
    }
  }
  return { pubkey, relays };
}

/**
 * Fetch and JSON-parse a Namecoin record value, returning null on any
 * failure mode (missing, expired, malformed).
 */
async function fetchRecord(
  name: string
): Promise<Record<string, unknown> | null> {
  const result = await nameShowWithFallback(name);
  if (!result || result.expired || !result.value) return null;
  try {
    return JSON.parse(result.value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Walk the `import` chain (ifa-0001 §Import) and produce a single merged
 * record. Later names in the chain override earlier ones, except we treat
 * the *original* record as authoritative for the top-level `nostr` field if
 * it sets one; everything else (including `nostr` when the original doesn't
 * have one) comes from the imported record.
 *
 * In practice the deployed pattern is `d/<name> -> import "dd/<name>"` with
 * the `nostr` payload living on the `dd/` record, so for the NIP-05 use
 * case we just need to surface any `nostr` field found anywhere in the
 * chain.
 */
async function mergeRecordWithImports(
  start: Record<string, unknown>,
  depth = 0,
  visited: Set<string> = new Set()
): Promise<Record<string, unknown>> {
  if (depth >= MAX_IMPORT_DEPTH) return start;
  const imp = start.import;
  if (!imp) return start;

  // `import` may be a string, an array of strings, or an ifa-0001 array of
  // [name, subpath] tuples. We only honour the string and string[] forms
  // here — sub-path imports are rarely used for the nostr field and the
  // other deployed impls (amethyst, nostrudel, dart-nostr) all treat them
  // identically.
  const names: string[] = [];
  if (typeof imp === "string") names.push(imp);
  else if (Array.isArray(imp)) {
    for (const entry of imp) {
      if (typeof entry === "string") names.push(entry);
      else if (Array.isArray(entry) && typeof entry[0] === "string") {
        names.push(entry[0] as string);
      }
    }
  }

  // Walk each import target depth-first; first hit that yields a nostr
  // value wins. Original record fields take precedence for non-nostr keys,
  // but we don't actually care about non-nostr keys here.
  for (const name of names) {
    if (visited.has(name)) continue;
    visited.add(name);
    try {
      const imported = await fetchRecord(name);
      if (!imported) continue;
      const merged = await mergeRecordWithImports(imported, depth + 1, visited);
      if (start.nostr) return { ...merged, nostr: start.nostr };
      if (merged.nostr) return merged;
    } catch {
      // ignore and try next import
    }
  }
  return start;
}

/**
 * Resolve a `.bit` NIP-05 identifier to a Nostr pubkey.
 *
 * Returns `null` for unknown / expired / malformed records. Catches all
 * transport errors and degrades to `null` so callers can fall back to
 * whatever the regular HTTPS NIP-05 path would have done (which for `.bit`
 * is always failure — the whole point of this resolver is to avoid the
 * DNS dependency entirely).
 */
export async function resolveBitNip05(
  addr: string
): Promise<NamecoinNip05Result | null> {
  const parsed = parseBitIdentifier(addr);
  if (!parsed) return null;

  const cacheKey = `${parsed.namecoinName}:${parsed.localPart ?? ""}`;
  const cached = cacheGet<NamecoinNip05Result | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const json = await fetchRecord(parsed.namecoinName);
    if (!json) {
      cacheSet<NamecoinNip05Result | null>(cacheKey, null);
      return null;
    }
    const merged = await mergeRecordWithImports(json);
    const extracted = extractNostrData(merged, parsed);
    cacheSet<NamecoinNip05Result | null>(cacheKey, extracted);
    return extracted;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[namecoin] .bit resolution failed for", addr, err);
    return null;
  }
}
