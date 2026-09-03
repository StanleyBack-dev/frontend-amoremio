import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export const config = {
  port: toNumber(process.env.BFF_PORT, 5050),
  backendGraphqlUrl:
    process.env.BACKEND_GRAPHQL_URL || "http://localhost:4000/graphql",
  backendProtectionBypassSecret:
    process.env.BACKEND_PROTECTION_BYPASS_SECRET || undefined,
  // Heavy mutations (finalize a purchase / complete a production order) fan
  // out into a batched stock transaction against a cloud database, so the
  // upstream ceiling has to leave room for that.
  graphqlRequestTimeoutMs: toNumber(process.env.BFF_GRAPHQL_TIMEOUT_MS, 25000),
  graphqlMaxRetries: toNumber(process.env.BFF_GRAPHQL_MAX_RETRIES, 2),
  graphqlRetryBaseDelayMs: toNumber(
    process.env.BFF_GRAPHQL_RETRY_BASE_DELAY_MS,
    150,
  ),
  listCacheTtlMs: toNumber(process.env.BFF_LIST_CACHE_TTL_MS, 15000),
  observabilityLogsEnabled: toBoolean(
    process.env.BFF_OBSERVABILITY_LOGS_ENABLED,
    true,
  ),
  observabilityLogPayloadMaxChars: toNumber(
    process.env.BFF_OBSERVABILITY_LOG_PAYLOAD_MAX_CHARS,
    1500,
  ),
  observabilityRecentEventsLimit: toNumber(
    process.env.BFF_OBSERVABILITY_RECENT_EVENTS_LIMIT,
    200,
  ),
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || undefined,
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  rateLimit: {
    auth: {
      windowSeconds: toNumber(
        process.env.BFF_RATE_LIMIT_AUTH_WINDOW_SECONDS,
        60,
      ),
      max: toNumber(process.env.BFF_RATE_LIMIT_AUTH_MAX, 10),
    },
    passwordRecovery: {
      windowSeconds: toNumber(
        process.env.BFF_RATE_LIMIT_PASSWORD_RECOVERY_WINDOW_SECONDS,
        900,
      ),
      max: toNumber(process.env.BFF_RATE_LIMIT_PASSWORD_RECOVERY_MAX, 5),
    },
    mutation: {
      windowSeconds: toNumber(
        process.env.BFF_RATE_LIMIT_MUTATION_WINDOW_SECONDS,
        60,
      ),
      max: toNumber(process.env.BFF_RATE_LIMIT_MUTATION_MAX, 60),
    },
    query: {
      windowSeconds: toNumber(
        process.env.BFF_RATE_LIMIT_QUERY_WINDOW_SECONDS,
        60,
      ),
      max: toNumber(process.env.BFF_RATE_LIMIT_QUERY_MAX, 120),
    },
  },
};
