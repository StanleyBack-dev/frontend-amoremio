function toBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

// Toggle local auth behavior from this single file.
export const devAuthConfig = {
  enabled: toBoolean(process.env.BFF_DEV_AUTH_ENABLED, false),
  // Use a fixed local user identifier when dev auth is enabled.
  userId: process.env.BFF_DEV_AUTH_USER_ID || "dev-local-user",
  // Option 1: paste a valid backend JWT here for local development.
  bearerToken: process.env.BFF_DEV_AUTH_BEARER_TOKEN || "",
  // Option 2: let BFF auto-login and forward backend auth cookies.
  login: {
    username: process.env.BFF_DEV_AUTH_USERNAME || "",
    password: process.env.BFF_DEV_AUTH_PASSWORD || "",
  },
};
