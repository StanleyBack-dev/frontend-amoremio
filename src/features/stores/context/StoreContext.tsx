import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Store } from "@/api/stores/schema";
import { fetchMyStores } from "../services/store.service";
import { useAuthSession } from "@/features/auth";
import { StoreContext, type StoreContextValue } from "./store-context";

const ACTIVE_STORE_STORAGE_KEY = "amoremio:activeStoreId";

function readStoredActiveStoreId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_STORE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistActiveStoreId(idStore: string | null): void {
  try {
    if (idStore) {
      window.localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, idStore);
    } else {
      window.localStorage.removeItem(ACTIVE_STORE_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable — the active store just won't persist across reloads.
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthSession();
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(
    readStoredActiveStoreId(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const reloadStores = useCallback(async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchMyStores();
      if (seq !== requestSeq.current) {
        return;
      }
      setStores(result);
      setActiveStoreId((current) => {
        if (current && result.some((store) => store.idStore === current)) {
          return current;
        }
        return result[0]?.idStore ?? null;
      });
    } catch (loadError) {
      if (seq !== requestSeq.current) {
        return;
      }
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as lojas.",
      );
    } finally {
      if (seq === requestSeq.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void reloadStores();
    } else {
      requestSeq.current++;
      setStores([]);
      setActiveStoreId(null);
      setError(null);
    }
  }, [isAuthenticated, reloadStores]);

  useEffect(() => {
    persistActiveStoreId(activeStoreId);
  }, [activeStoreId]);

  const setActiveStore = useCallback((idStore: string) => {
    setActiveStoreId(idStore);
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const activeStore =
      stores.find((store) => store.idStore === activeStoreId) ?? null;
    return {
      stores,
      activeStore,
      activeStoreId: activeStore?.idStore ?? null,
      isLoading,
      error,
      setActiveStore,
      reloadStores,
    };
  }, [stores, activeStoreId, isLoading, error, setActiveStore, reloadStores]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
