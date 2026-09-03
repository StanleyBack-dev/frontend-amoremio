import type { AuthSessionResponse } from "../../../api/auth/schema";
import type { PageAccessKey } from "../../../api/users/schema";
import type { ActiveView } from "../../../types/views";

export interface AuthorizationPolicyContext {
  session: AuthSessionResponse | null;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  isInitializing: boolean;
  pagePermissions: PageAccessKey[];
  hasPageAccess: (view: ActiveView) => boolean;
}

export type AuthorizationPolicy = (
  context: AuthorizationPolicyContext,
) => boolean;
