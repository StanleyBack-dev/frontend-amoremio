import { createContext } from "react";
import type { Store } from "@/api/stores/schema";

export interface StoreContextValue {
  stores: Store[];
  activeStore: Store | null;
  activeStoreId: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveStore: (idStore: string) => void;
  reloadStores: () => Promise<void>;
}

export const StoreContext = createContext<StoreContextValue | undefined>(
  undefined,
);
