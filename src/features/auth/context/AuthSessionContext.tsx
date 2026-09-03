import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  registerAuthRefreshHandler,
  setTermsGateOpen,
} from "../../../api/shared/http-client";
import type { AuthSessionResponse } from "../../../api/auth/schema";
import type { PageAccessKey } from "../../../api/users/schema";
import type { ActiveView } from "../../../types/views";
import {
  loadMyPagePermissions,
  refreshSessionFromCookie,
} from "../services/auth.service";
import {
  getGroupDefaultPagePermissions,
  hasPageAccess,
} from "../model/page-access";
import {
  clearStoredAuthSession,
  clearStoredPagePermissions,
  setStoredAuthSession,
  setStoredPagePermissions,
} from "../utils/sessionStorage";
import { subscribeAuthSessionEvents } from "../utils/auth-session-events";

interface AuthSessionContextValue {
  session: AuthSessionResponse | null;
  pagePermissions: PageAccessKey[];
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  isInitializing: boolean;
  setSession: (session: AuthSessionResponse) => void;
  clearSession: () => void;
  markPasswordChanged: () => void;
  markOnboardingTourCompleted: () => void;
  markTermsAccepted: () => void;
  updateSessionUserName: (name: string) => void;
  hasPageAccess: (view: ActiveView) => boolean;
}

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(
  null,
);

interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [session, setSessionState] = useState<AuthSessionResponse | null>(null);
  const [pagePermissions, setPagePermissions] = useState<PageAccessKey[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const applySession = useCallback((nextSession: AuthSessionResponse) => {
    const defaultPermissions = getGroupDefaultPagePermissions(
      nextSession.user.group,
    );

    setSessionState(nextSession);
    setStoredAuthSession(nextSession);
    setPagePermissions([]);
    clearStoredPagePermissions();
    setIsInitializing(true);

    void loadMyPagePermissions()
      .then((permissions) => {
        setPagePermissions(permissions);
        setStoredPagePermissions(permissions);
      })
      .catch(() => {
        setPagePermissions(defaultPermissions);
        setStoredPagePermissions(defaultPermissions);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  // Used by the http client's silent-refresh path: a background token
  // renewal must swap in the new session without toggling `isInitializing`,
  // which would otherwise replace the whole app with the splash screen every
  // time the access token cookie is renewed behind the scenes.
  const applySessionSilently = useCallback(
    (nextSession: AuthSessionResponse) => {
      setSessionState(nextSession);
      setStoredAuthSession(nextSession);
    },
    [],
  );

  const clearSession = useCallback(() => {
    setSessionState(null);
    setPagePermissions([]);
    clearStoredAuthSession();
    clearStoredPagePermissions();
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setIsInitializing(true);

    refreshSessionFromCookie()
      .then((refreshedSession) => {
        if (cancelled) return;

        if (refreshedSession?.authenticated) {
          applySession(refreshedSession);

          return;
        }

        clearSession();
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  useEffect(() => {
    return subscribeAuthSessionEvents((event) => {
      if (event.type === "refreshed") {
        applySession(event.session);
        return;
      }

      clearSession();
    });
  }, [applySession, clearSession]);

  useEffect(() => {
    // Any request can hit a 401 once the short-lived access token cookie
    // expires. The http client calls this handler to silently renew the
    // session (via the refresh token cookie) and retry the request instead
    // of forcing the user back to the login screen every few minutes.
    registerAuthRefreshHandler(async () => {
      const refreshedSession = await refreshSessionFromCookie();

      if (refreshedSession?.authenticated) {
        applySessionSilently(refreshedSession);
        return true;
      }

      clearSession();
      return false;
    });

    return () => {
      registerAuthRefreshHandler(null);
    };
  }, [applySessionSilently, clearSession]);

  useEffect(() => {}, [pagePermissions]);

  useEffect(() => {
    setTermsGateOpen(!session || Boolean(session.termsAccepted));
  }, [session]);

  const setSession = useCallback(
    (nextSession: AuthSessionResponse) => {
      applySession(nextSession);
    },
    [applySession],
  );

  const markPasswordChanged = useCallback(() => {
    setSessionState((current) => {
      if (!current) return current;

      return {
        ...current,
        mustChangePassword: false,
      };
    });
  }, []);

  const markOnboardingTourCompleted = useCallback(() => {
    setSessionState((current) => {
      if (!current) return current;

      return {
        ...current,
        onboardingTourCompleted: true,
      };
    });
  }, []);

  const markTermsAccepted = useCallback(() => {
    setSessionState((current) => {
      if (!current) return current;

      return {
        ...current,
        termsAccepted: true,
        isTermsReacceptance: false,
      };
    });
  }, []);

  const updateSessionUserName = useCallback((name: string) => {
    setSessionState((current) => {
      if (!current) return current;

      return {
        ...current,
        user: {
          ...current.user,
          name,
        },
      };
    });
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.authenticated),
      pagePermissions,
      requiresPasswordChange: Boolean(session?.mustChangePassword),
      isInitializing,
      setSession,
      clearSession,
      markPasswordChanged,
      markOnboardingTourCompleted,
      markTermsAccepted,
      updateSessionUserName,
      hasPageAccess: (view) => hasPageAccess(view, pagePermissions),
    }),
    [
      clearSession,
      isInitializing,
      markPasswordChanged,
      markOnboardingTourCompleted,
      markTermsAccepted,
      updateSessionUserName,
      pagePermissions,
      session,
      setSession,
    ],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
