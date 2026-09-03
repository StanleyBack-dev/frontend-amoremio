import Button from "@atoms/Button";

const PAGE_SIZE_OPTIONS = [15, 30, 50, 100];

interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

// Builds a compact page list: 1 … (p-1) p (p+1) … last.
function pageWindow(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < pageCount - 1) out.push("…");
  out.push(pageCount);
  return out;
}

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  disabled = false,
}: PaginationProps) {
  const safePageCount = Math.max(pageCount, 1);
  const current = Math.min(Math.max(page, 1), safePageCount);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  // Nothing to page through — the table's own empty message covers it.
  if (total === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-muted">
      <span className="tabular-nums">
        {total === 0
          ? "Nenhum registro"
          : `Mostrando ${from}–${to} de ${total}`}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>Itens por página:</span>
            <select
              className="rounded-md border border-hairline-strong bg-field px-2 py-1 text-ink outline-none"
              value={pageSize}
              disabled={disabled}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || current <= 1}
            onClick={() => onPageChange(current - 1)}
          >
            Anterior
          </Button>

          {pageWindow(current, safePageCount).map((entry, index) =>
            entry === "…" ? (
              <span
                key={`gap-${index}`}
                className="px-1.5 text-ink-subtle select-none"
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(entry)}
                className={`min-w-[2rem] rounded-md px-2 py-1 text-[13px] tabular-nums transition-colors ${
                  entry === current
                    ? "bg-brand-600 font-semibold text-white"
                    : "text-ink hover:bg-card-alt"
                }`}
              >
                {entry}
              </button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || current >= safePageCount}
            onClick={() => onPageChange(current + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
