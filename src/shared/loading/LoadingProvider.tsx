import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import LoadingOverlay from "../../components/molecules/LoadingOverlay";
import { LoadingContext, type LoadingContextValue } from "./LoadingContext";

interface LoadingProviderProps {
  children: ReactNode;
}

// Grace period before the overlay actually shows: fast requests finish first
// and never flash a spinner on screen.
const SHOW_DELAY_MS = 140;

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [pending, setPending] = useState(0);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pending === 0) {
      setVisible(false);
      setLabel(null);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const begin = useCallback((nextLabel?: string) => {
    if (nextLabel) setLabel(nextLabel);
    setPending((count) => count + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setPending((count) => Math.max(0, count - 1));
    };
  }, []);

  const track = useCallback(
    function trackPromise<T>(
      promise: Promise<T>,
      nextLabel?: string,
    ): Promise<T> {
      const end = begin(nextLabel);
      return promise.finally(end);
    },
    [begin],
  );

  const value = useMemo<LoadingContextValue>(
    () => ({ isLoading: pending > 0, begin, track }),
    [pending, begin, track],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay open={visible} label={label ?? undefined} />
    </LoadingContext.Provider>
  );
}
