import { createContext } from "react";

export interface LoadingContextValue {
  /** True while at least one tracked task is in flight. */
  isLoading: boolean;
  /**
   * Increment the pending counter and get back a one-shot release function.
   * Use when begin/end can't be expressed as a single promise.
   */
  begin: (label?: string) => () => void;
  /**
   * Show the centered overlay until `promise` settles, then resolve/reject
   * with its result. The overlay only appears if the task is slow enough to
   * warrant it (see SHOW_DELAY_MS in the provider).
   */
  track: <T>(promise: Promise<T>, label?: string) => Promise<T>;
}

export const LoadingContext = createContext<LoadingContextValue | null>(null);
