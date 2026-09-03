import { HttpError } from "../http/http-error.js";
import { devAuthConfig } from "./dev-auth.config.js";

export function getAuthContext(req) {
  const authorizationHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;

  const hasAuthorization =
    typeof authorizationHeader === "string" &&
    Boolean(authorizationHeader.trim());
  const hasCookie =
    typeof cookieHeader === "string" && Boolean(cookieHeader.trim());

  if (hasAuthorization) {
    return {
      userId: undefined,
      authorization: authorizationHeader.trim(),
      cookieHeader: undefined,
      source: "request-authorization",
    };
  }

  if (hasCookie) {
    return {
      userId: undefined,
      authorization: undefined,
      cookieHeader: cookieHeader.trim(),
      source: "request-cookies",
    };
  }

  if (devAuthConfig.enabled) {
    return {
      userId: devAuthConfig.userId,
      authorization: devAuthConfig.bearerToken?.trim()
        ? `Bearer ${devAuthConfig.bearerToken.trim()}`
        : undefined,
      cookieHeader: undefined,
      source: "dev-auth-config",
    };
  }

  throw new HttpError(
    401,
    "Missing Authorization header or auth cookies in request.",
  );
}

export function getUserId(req) {
  return getAuthContext(req).userId;
}
