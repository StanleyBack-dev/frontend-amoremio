import { createContext, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useUsers, type UseUsersResult } from "../../../hooks/users/useUsers";

export const UsersContext = createContext<UseUsersResult | null>(null);

interface UsersProviderProps {
  children: ReactNode;
}

export function UsersProvider({ children }: UsersProviderProps) {
  const usersState = useUsers();

  return (
    <UsersContext.Provider value={usersState}>{children}</UsersContext.Provider>
  );
}

export function UsersProviderOutlet({ userId }: { userId?: string } = {}) {
  void userId;
  return (
    <UsersProvider>
      <Outlet />
    </UsersProvider>
  );
}
