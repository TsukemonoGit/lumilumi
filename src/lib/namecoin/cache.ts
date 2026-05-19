/**
 * Tiny in-memory LRU cache for Namecoin resolution results.
 *
 * Keyed by `${namecoinName}:${localPart ?? ""}` so the same `d/example`
 * record looked up under different local parts gets its own entry.
 */
import { DEFAULT_CACHE_TTL_MS } from "./constants";

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const MAX_ENTRIES = 200;
const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  // Map iteration order is insertion order — re-insert to mark as most
  // recently used.
  store.delete(key);
  store.set(key, entry);
  return entry.value as T;
}

export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

/** Test helper. */
export function _cacheClear(): void {
  store.clear();
}
