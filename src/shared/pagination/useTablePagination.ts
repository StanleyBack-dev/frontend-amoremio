import { useCallback, useState } from "react";

export interface TablePageMeta {
  total: number;
  totalPages: number;
}

export interface TablePagination {
  /** 1-based current page. */
  page: number;
  limit: number;
  meta: TablePageMeta;
  setPage: (page: number) => void;
  /** Changes the page size and jumps back to page 1. */
  setLimit: (limit: number) => void;
  /** Feeds server metadata back after a fetch. */
  setMeta: (meta: TablePageMeta) => void;
  /** Jump to page 1 — call this whenever a filter changes. */
  reset: () => void;
}

const ZERO_META: TablePageMeta = { total: 0, totalPages: 1 };

// Local state for a server-paginated table. Every list page owns one of these;
// its `page`/`limit` go into the list request and `setMeta` records what the
// backend returned. The actual paging (offset, total, ordering) lives on the
// backend — this only tracks which page the user is looking at.
//
// Destructure the result so each field can go into effect dependency arrays
// individually (`page`/`limit` are values; `setPage`/`setLimit`/`setMeta`/
// `reset` are stable across renders).
export function useTablePagination(initialLimit = 15): TablePagination {
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [meta, setMetaState] = useState<TablePageMeta>(ZERO_META);

  const setPage = useCallback((next: number) => {
    setPageState(Math.max(1, Math.trunc(next) || 1));
  }, []);

  const setLimit = useCallback((next: number) => {
    setLimitState(next);
    setPageState(1);
  }, []);

  // Keep the same object reference when nothing actually changed, so callers
  // can safely leave this out of their fetch effect's dependency array.
  const setMeta = useCallback((next: TablePageMeta) => {
    setMetaState((prev) =>
      prev.total === next.total && prev.totalPages === next.totalPages
        ? prev
        : next,
    );
  }, []);

  const reset = useCallback(() => setPageState(1), []);

  return { page, limit, meta, setPage, setLimit, setMeta, reset };
}
