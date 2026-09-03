import type { AuthSessionResponse } from "../../../api/auth/schema";

type AuthSessionEvent =
  | {
      type: "refreshed";
      session: AuthSessionResponse;
    }
  | {
      type: "cleared";
    };

type AuthSessionListener = (event: AuthSessionEvent) => void;

const listeners = new Set<AuthSessionListener>();

export function subscribeAuthSessionEvents(listener: AuthSessionListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function emitAuthSessionRefreshed(session: AuthSessionResponse): void {
  for (const listener of listeners) {
    listener({ type: "refreshed", session });
  }
}

export function emitAuthSessionCleared(): void {
  for (const listener of listeners) {
    listener({ type: "cleared" });
  }
}
