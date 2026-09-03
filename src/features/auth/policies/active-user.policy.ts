import type { AuthorizationPolicy } from "../model/authorization-policy";

export const requireActiveUserPolicy: AuthorizationPolicy = (context) =>
  Boolean(context.session?.user.status);
