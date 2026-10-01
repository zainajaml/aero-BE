import { api, unwrap } from "./client";
import type { components } from "./schema.gen";

export type StorageArea = components["schemas"]["StorageArea"];

type CacheEntry = { url: string; expiresAt: number };
// Signed URLs live for an hour server-side; refresh well before that.
const TTL_MS = 45 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
const pending = new Map<StorageArea, Map<string, Array<(url: string | null) => void>>>();
let flushScheduled = false;

async function flush() {
  flushScheduled = false;
  const batches = [...pending.entries()];
  pending.clear();
  await Promise.all(
    batches.map(async ([area, waiters]) => {
      const keys = [...waiters.keys()];
      let urls: Record<string, string> = {};
      try {
        for (let i = 0; i < keys.length; i += 200) {
          const result = await unwrap(
            api.POST("/api/v1/files/signed-urls", { body: { area, keys: keys.slice(i, i + 200) } }),
          );
          urls = { ...urls, ...result.urls };
        }
      } catch {
        urls = {};
      }
      for (const [key, callbacks] of waiters) {
        const url = urls[key] ?? null;
        if (url) cache.set(`${area}:${key}`, { url, expiresAt: Date.now() + TTL_MS });
        callbacks.forEach((callback) => callback(url));
      }
    }),
  );
}

/** Cached, micro-batched signed URL for a stored file (null when the caller may not read it). */
export function signedUrl(area: StorageArea, key: string): Promise<string | null> {
  const hit = cache.get(`${area}:${key}`);
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.url);
  return new Promise((resolve) => {
    const forArea = pending.get(area) ?? new Map<string, Array<(url: string | null) => void>>();
    forArea.set(key, [...(forArea.get(key) ?? []), resolve]);
    pending.set(area, forArea);
    if (!flushScheduled) {
      flushScheduled = true;
      queueMicrotask(() => void flush());
    }
  });
}

export function cachedSignedUrl(area: StorageArea, key: string): string | null {
  const hit = cache.get(`${area}:${key}`);
  return hit && hit.expiresAt > Date.now() ? hit.url : null;
}
