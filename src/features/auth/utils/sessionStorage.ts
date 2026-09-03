import { type AuthSessionResponse } from "../../../api/auth/schema";
import type { PageAccessKey } from "../../../api/users/schema";

// IMPORTANT: sessionStorage usage removed for security.
// This module keeps auth/session info only in-memory for the current runtime.

let inMemoryAuthSession: AuthSessionResponse | null = null;
let inMemoryPagePermissions: PageAccessKey[] = [];

export function getStoredAuthSession(): AuthSessionResponse | null {
  return inMemoryAuthSession;
}

export function setStoredAuthSession(session: AuthSessionResponse): void {
  inMemoryAuthSession = session;
}

export function clearStoredAuthSession(): void {
  inMemoryAuthSession = null;
}

export function getStoredPagePermissions(): PageAccessKey[] {
  return inMemoryPagePermissions.slice();
}

export function setStoredPagePermissions(
  pagePermissions: PageAccessKey[],
): void {
  inMemoryPagePermissions = pagePermissions.slice();
}

export function clearStoredPagePermissions(): void {
  inMemoryPagePermissions = [];
}
