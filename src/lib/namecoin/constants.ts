/**
 * Namecoin protocol + transport constants.
 *
 * The default ElectrumX server set is the browser-WSS-compatible subset of
 * the canonical Amethyst list (`quartz/.../namecoin/ElectrumXServer.kt
 * DEFAULT_ELECTRUMX_SERVERS`). Bare-IP entries (23.158.233.10,
 * 46.229.238.187) are intentionally omitted because browsers refuse WSS
 * handshakes to bare IPs without an IP-SAN certificate.
 *
 * Wire format and port convention (TLS port + 2 for WSS) match the merged
 * Amethyst, Nostur, dart-nostr and nostrudel ports.
 */
export interface ElectrumxServer {
  /** wss:// URL */
  url: string;
  /** Human-readable label */
  label: string;
}

export const DEFAULT_ELECTRUMX_SERVERS: ElectrumxServer[] = [
  { url: "wss://electrumx.testls.space:50004", label: "testls.space" },
  { url: "wss://nmc2.bitcoins.sk:57004", label: "bitcoins.sk" },
  { url: "wss://relay.testls.bit:50004", label: "relay.testls.bit" },
  {
    url: "wss://electrum.nmc.ethicnology.com:50004",
    label: "ethicnology",
  },
];

/** Namecoin names expire 36000 blocks (~250 days) after their last update. */
export const NAME_EXPIRE_DEPTH = 36000;

/** Default cache TTL for resolution results. */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
