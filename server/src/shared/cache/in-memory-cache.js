import { logEvent } from "../observability/logger.js";
import { recordCacheEvent } from "../observability/metrics-store.js";

const cache = new Map();

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries
      .map(([key, entryValue]) => `${key}:${stableStringify(entryValue)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function buildCacheKey(namespace, userId, input = {}) {
  return `${namespace}:${userId}:${stableStringify(input)}`;
}

function getNamespaceFromKey(key) {
  const [namespace] = String(key).split(":");
  return namespace || "unknown";
}

export function getCache(key) {
  const namespace = getNamespaceFromKey(key);
  const entry = cache.get(key);
  if (!entry) {
    recordCacheEvent({
      action: "miss",
      key,
      namespace,
    });

    logEvent("info", "cache.miss", {
      key,
      namespace,
    });

    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);

    recordCacheEvent({
      action: "miss",
      key,
      namespace,
    });

    logEvent("info", "cache.expired", {
      key,
      namespace,
    });

    return undefined;
  }

  recordCacheEvent({
    action: "hit",
    key,
    namespace,
  });

  logEvent("info", "cache.hit", {
    key,
    namespace,
  });

  return entry.value;
}

export function setCache(key, value, ttlMs) {
  const namespace = getNamespaceFromKey(key);

  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  recordCacheEvent({
    action: "set",
    key,
    namespace,
    ttlMs,
  });

  logEvent("info", "cache.set", {
    key,
    namespace,
    ttlMs,
  });

  return value;
}

export async function getOrSetCache(key, producer, ttlMs) {
  const cached = getCache(key);
  if (cached !== undefined) {
    return cached;
  }

  const produced = await producer();
  return setCache(key, produced, ttlMs);
}

export function invalidateCacheByPrefix(prefix) {
  let removed = 0;

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      removed += 1;
    }
  }

  recordCacheEvent({
    action: "invalidate",
    prefix,
  });

  logEvent("info", "cache.invalidate", {
    prefix,
    removed,
  });
}
