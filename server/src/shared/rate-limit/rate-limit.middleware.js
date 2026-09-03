import { logEvent } from "../observability/logger.js";
import { consumeRateLimit } from "./rate-limiter.js";
import { RATE_LIMIT_TIERS } from "./rate-limit-tier.js";

const AUTH_PATHS = new Set(["/api/auth/login", "/api/auth/login/google"]);
const PASSWORD_RECOVERY_PATH_PREFIX = "/api/auth/password-recovery";

function resolveTier(req) {
  if (AUTH_PATHS.has(req.path)) {
    return RATE_LIMIT_TIERS.AUTH;
  }

  if (req.path.startsWith(PASSWORD_RECOVERY_PATH_PREFIX)) {
    return RATE_LIMIT_TIERS.PASSWORD_RECOVERY;
  }

  return req.method === "GET"
    ? RATE_LIMIT_TIERS.QUERY
    : RATE_LIMIT_TIERS.MUTATION;
}

function extractClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];

  return first?.trim() || req.socket?.remoteAddress || "unknown";
}

function sendTooManyRequests(res, retryAfterSeconds) {
  if (retryAfterSeconds) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
  }

  res.status(429).json({
    success: false,
    message: retryAfterSeconds
      ? `Muitas requisições. Tente novamente em ${retryAfterSeconds} segundos.`
      : "Muitas requisições. Tente novamente em instantes.",
    error: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
    details: null,
    statusCode: 429,
  });
}

export async function rateLimitMiddleware(req, res, next) {
  const tier = resolveTier(req);
  const ip = extractClientIp(req);

  try {
    const ipResult = await consumeRateLimit(tier, `ip:${ip}`);

    if (!ipResult.allowed) {
      sendTooManyRequests(res, ipResult.retryAfterSeconds);
      return;
    }

    if (tier === RATE_LIMIT_TIERS.PASSWORD_RECOVERY) {
      const email = req.body?.email;

      if (typeof email === "string" && email.trim()) {
        const emailResult = await consumeRateLimit(
          tier,
          `email:${email.trim().toLowerCase()}`,
        );

        if (!emailResult.allowed) {
          sendTooManyRequests(res, emailResult.retryAfterSeconds);
          return;
        }
      }
    }

    next();
  } catch (error) {
    logEvent("error", "rate_limit.check_failed", {
      requestId: req.requestId,
      path: req.path,
      message: error?.message,
    });
    next();
  }
}
