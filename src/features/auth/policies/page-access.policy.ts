import type { ActiveView } from "../../../types/views";
import type { AuthorizationPolicy } from "../model/authorization-policy";

export function createPageAccessPolicy(view: ActiveView): AuthorizationPolicy {
  return (context) => context.hasPageAccess(view);
}
