import type { ActiveView } from "../../../types/views";
import RequireAuthorizationRoute from "./RequireAuthorizationRoute";
import { createPageAccessPolicy } from "../policies/page-access.policy";

interface RequirePageAccessRouteProps {
  view: ActiveView;
}

export default function RequirePageAccessRoute({
  view,
}: RequirePageAccessRouteProps) {
  return (
    <RequireAuthorizationRoute
      policy={createPageAccessPolicy(view)}
      deniedView={view}
    />
  );
}
