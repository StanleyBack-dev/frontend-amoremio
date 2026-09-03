import { useContext } from "react";
import { StoreContext, type StoreContextValue } from "./store-context";

export function useStoreContext(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStoreContext must be used within a StoreProvider");
  }
  return context;
}
