const STORAGE_KEY = "amoremio_password_recovery";

export interface PasswordRecoverySession {
  email: string;
  expiresAt: string;
  recoveryToken: string;
}

export function savePasswordRecoverySession(
  session: PasswordRecoverySession,
): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getPasswordRecoverySession(): PasswordRecoverySession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PasswordRecoverySession;

    if (
      !parsed ||
      typeof parsed.email !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      typeof parsed.recoveryToken !== "string"
    ) {
      clearPasswordRecoverySession();
      return null;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      clearPasswordRecoverySession();
      return null;
    }

    return parsed;
  } catch {
    clearPasswordRecoverySession();
    return null;
  }
}

export function clearPasswordRecoverySession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
