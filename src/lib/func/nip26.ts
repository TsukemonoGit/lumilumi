import { sha256 } from "@noble/hashes/sha256";
import { hexToBytes } from "@noble/hashes/utils";
import { schnorr } from "@noble/curves/secp256k1";
import type * as Nostr from "nostr-typedef";

/**
 * Result of a verified NIP-26 delegation.
 */
export interface Delegation {
  /** The delegator's public key (hex) — the account on whose behalf the event was published. */
  delegator: string;
  /** The raw conditions query string (e.g. "kind=1&created_at<1700000000"). */
  conditions: string;
}

/**
 * Parses and verifies the NIP-26 `delegation` tag of an event.
 *
 * Returns the delegator information only when the delegation token signature is
 * valid AND the event satisfies the delegation conditions. Returns null otherwise
 * (no tag, malformed tag, unmet conditions, or bad signature) so that a forged
 * delegation tag is never displayed as a genuine one.
 *
 * @see https://github.com/nostr-protocol/nips/blob/master/26.md
 */
export function getDelegation(event: Nostr.Event): Delegation | null {
  const tag = (event.tags || []).find(
    (t) => t[0] === "delegation" && t.length >= 4,
  );
  if (!tag) return null;

  const [, delegator, conditions, sig] = tag;
  if (!delegator || !sig) return null;

  // The event must satisfy the delegation conditions.
  if (!checkConditions(conditions, event)) return null;

  // Verify the delegation token was signed by the delegator.
  try {
    const token = `nostr:delegation:${event.pubkey}:${conditions}`;
    const hash = sha256(new TextEncoder().encode(token));
    if (!schnorr.verify(hexToBytes(sig), hash, hexToBytes(delegator))) {
      return null;
    }
  } catch {
    return null;
  }

  return { delegator, conditions };
}

/**
 * Checks whether an event satisfies a NIP-26 conditions query string.
 * Supported conditions: `kind=<n>`, `created_at<<n>`, `created_at><n>`.
 *
 * Conditions are joined by `&`. Multiple `kind=` entries are treated as a
 * whitelist (the event kind must match ANY of them) — this matches how
 * delegation tokens are generated in practice (e.g. `kind=1&kind=6&kind=7`).
 * `created_at` bounds must all hold. An unknown condition is treated as
 * unsatisfied so a malformed token is never shown as valid.
 */
function checkConditions(conditions: string, event: Nostr.Event): boolean {
  if (!conditions) return true;

  const allowedKinds: number[] = [];

  for (const cond of conditions.split("&")) {
    const kind = cond.match(/^kind=(\d+)$/);
    if (kind) {
      allowedKinds.push(Number(kind[1]));
      continue;
    }
    const after = cond.match(/^created_at>(\d+)$/);
    if (after) {
      if (!(event.created_at > Number(after[1]))) return false;
      continue;
    }
    const before = cond.match(/^created_at<(\d+)$/);
    if (before) {
      if (!(event.created_at < Number(before[1]))) return false;
      continue;
    }
    return false;
  }

  if (allowedKinds.length > 0 && !allowedKinds.includes(event.kind)) {
    return false;
  }
  return true;
}
