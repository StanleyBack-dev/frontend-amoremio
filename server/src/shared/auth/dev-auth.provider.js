import axios from "axios";
import { config } from "../../config/env.js";
import { HttpError } from "../http/http-error.js";
import { logEvent } from "../observability/logger.js";
import { devAuthConfig } from "./dev-auth.config.js";

const TOKEN_REFRESH_SKEW_MS = 30_000;

let cachedHeaders = null;
let cachedHeadersExpiresAt = 0;
let inFlightHeadersPromise = null;

function getCookieByName(setCookieHeaders, cookieName) {
  for (const cookieLine of setCookieHeaders) {
    if (typeof cookieLine !== "string") {
      continue;
    }

    if (cookieLine.startsWith(`${cookieName}=`)) {
      return cookieLine.split(";", 1)[0];
    }
  }

  return undefined;
}

function buildDevLoginMutation() {
  return `
    mutation DevLogin($input: LoginInputDto!) {
      login(input: $input) {
        authenticated
        user {
          idUsers
          username
        }
      }
    }
  `;
}

function decodeJwtExpirationMs(accessToken) {
  const tokenParts = String(accessToken || "").split(".");
  if (tokenParts.length < 2) {
    return Date.now() + 5 * 60_000;
  }

  try {
    const payloadJson = Buffer.from(tokenParts[1], "base64url").toString(
      "utf8",
    );
    const payload = JSON.parse(payloadJson);
    if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
      return payload.exp * 1000;
    }
  } catch {
    return Date.now() + 5 * 60_000;
  }

  return Date.now() + 5 * 60_000;
}

function getCookieValue(cookieEntry) {
  const [pair] = String(cookieEntry || "").split(";", 1);
  const separatorIndex = pair.indexOf("=");
  if (separatorIndex <= 0) {
    return "";
  }

  return pair.slice(separatorIndex + 1);
}

function shouldUseCachedHeaders() {
  if (!cachedHeaders) {
    return false;
  }

  return Date.now() + TOKEN_REFRESH_SKEW_MS < cachedHeadersExpiresAt;
}

async function loginAndBuildHeaders(username, password) {
  const response = await axios.post(
    config.backendGraphqlUrl,
    {
      query: buildDevLoginMutation(),
      variables: {
        input: {
          username,
          password,
        },
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...(config.backendProtectionBypassSecret
          ? {
              "x-vercel-protection-bypass":
                config.backendProtectionBypassSecret,
            }
          : {}),
      },
    },
  );

  const gqlErrors = response.data?.errors;
  if (Array.isArray(gqlErrors) && gqlErrors.length > 0) {
    const firstMessage = gqlErrors[0]?.message || "Dev login failed.";
    throw new HttpError(401, `Dev login failed: ${firstMessage}`);
  }

  const setCookieHeaders = response.headers?.["set-cookie"];
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [];

  const accessCookie = getCookieByName(cookies, "accessToken");
  const refreshCookie = getCookieByName(cookies, "refreshToken");

  if (!accessCookie) {
    throw new HttpError(
      502,
      "Dev login succeeded but backend did not return accessToken cookie.",
    );
  }

  const cookieHeader = refreshCookie
    ? `${accessCookie}; ${refreshCookie}`
    : accessCookie;

  const accessToken = getCookieValue(accessCookie);
  cachedHeaders = { Cookie: cookieHeader };
  cachedHeadersExpiresAt = decodeJwtExpirationMs(accessToken);

  logEvent("info", "auth.dev.login.success", {
    backendGraphqlUrl: config.backendGraphqlUrl,
    username,
    cachedUntil: new Date(cachedHeadersExpiresAt).toISOString(),
  });

  return cachedHeaders;
}

export async function getDevAuthHeaders() {
  const token = devAuthConfig.bearerToken?.trim();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  const username = devAuthConfig.login?.username?.trim();
  const password = devAuthConfig.login?.password?.trim();

  if (!username || !password) {
    throw new HttpError(
      500,
      "Dev auth enabled, but no bearer token and no login credentials configured. Set BFF_DEV_AUTH_BEARER_TOKEN or BFF_DEV_AUTH_USERNAME/BFF_DEV_AUTH_PASSWORD in server/.env.local",
    );
  }

  if (shouldUseCachedHeaders()) {
    return cachedHeaders;
  }

  if (!inFlightHeadersPromise) {
    inFlightHeadersPromise = loginAndBuildHeaders(username, password)
      .catch((error) => {
        cachedHeaders = null;
        cachedHeadersExpiresAt = 0;
        throw error;
      })
      .finally(() => {
        inFlightHeadersPromise = null;
      });
  }

  return inFlightHeadersPromise;
}
