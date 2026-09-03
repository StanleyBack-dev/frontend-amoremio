import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { config } from "../../config/env.js";
import { logEvent } from "../observability/logger.js";
import { RATE_LIMIT_TIERS } from "./rate-limit-tier.js";

function buildLimiters() {
  if (!config.upstashRedisRestUrl || !config.upstashRedisRestToken) {
    return null;
  }

  const redis = new Redis({
    url: config.upstashRedisRestUrl,
    token: config.upstashRedisRestToken,
  });

  const map = {};

  for (const tier of Object.values(RATE_LIMIT_TIERS)) {
    const { windowSeconds, max } = config.rateLimit[tier];

    map[tier] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      // "bff" distinguishes this from the backend's own rate limiter, which
      // shares the same Upstash account/prefix convention but must track
      // its own independent counters — otherwise a normal request passing
      // through both layers would silently consume the same budget twice,
      // halving the effective limit nobody configured for.
      prefix: `amoremio:ratelimit:bff:${tier}`,
      analytics: false,
    });
  }

  return map;
}

const limiters = buildLimiters();
let hasWarnedMissingConfig = false;

export async function consumeRateLimit(tier, identity) {
  if (!limiters) {
    warnMissingConfigOnce();
    return { allowed: true };
  }

  const limiter = limiters[tier];

  if (!limiter) {
    return { allowed: true };
  }

  const result = await limiter.limit(identity);

  if (result.success) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      0,
      Math.ceil((result.reset - Date.now()) / 1000),
    ),
  };
}

function warnMissingConfigOnce() {
  if (hasWarnedMissingConfig) {
    return;
  }

  hasWarnedMissingConfig = true;
  logEvent("warn", "rate_limit.disabled", {
    reason:
      "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN não configurados — rate limiting está desabilitado (fail-open).",
  });
}
