import { login } from "../../../api/auth/methods/login";
import { getMyPagePermissions } from "../../../api/auth/methods/getMyPagePermissions";
import { logout } from "../../../api/auth/methods/logout";
import { refreshAuthSession } from "../../../api/auth/methods/refreshAuthSession";
import {
  AuthSessionResponseSchema,
  type AuthSessionResponse,
} from "../../../api/auth/schema";
import type { PageAccessKey } from "../../../api/users/schema";

interface LoginWithPasswordInput {
  username: string;
  password: string;
}

export async function loginWithPassword(
  input: LoginWithPasswordInput,
): Promise<AuthSessionResponse> {
  const response = await login({
    username: input.username,
    password: input.password,
  });

  const parsed = AuthSessionResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error("Não foi possível validar a sessão de autenticação.");
  }

  return parsed.data;
}

// The backend rotates the refresh token on every call (the old token stops
// validating the instant a new one is issued). If two callers invoke this at
// nearly the same moment — e.g. React StrictMode double-invoking the mount
// effect in dev, or the initial session hydration overlapping with a 401
// retry — they'd race to redeem the same starting token: whichever request
// reaches the backend second finds the session row already rotated out from
// under it and gets "Sessão inválida ou revogada.", logging the user out
// seconds after a successful login. Coalescing concurrent calls into a
// single in-flight request/result removes the race entirely, regardless of
// which caller triggered it.
let pendingSessionRefresh: Promise<AuthSessionResponse | null> | null = null;

export async function refreshSessionFromCookie(): Promise<AuthSessionResponse | null> {
  if (pendingSessionRefresh) {
    return pendingSessionRefresh;
  }

  pendingSessionRefresh = (async () => {
    try {
      const response = await refreshAuthSession();
      const parsed = AuthSessionResponseSchema.safeParse(response);

      if (!parsed.success) {
        return null;
      }

      if (!parsed.data.authenticated) {
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    } finally {
      pendingSessionRefresh = null;
    }
  })();

  return pendingSessionRefresh;
}

export async function logoutCurrentSession(): Promise<void> {
  await logout();
}

export async function loadMyPagePermissions(): Promise<PageAccessKey[]> {
  const response = await getMyPagePermissions();
  return response.effectivePermissions;
}
