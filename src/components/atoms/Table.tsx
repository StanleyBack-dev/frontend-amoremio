import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

interface TableColumn<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
  // When set, rows for which `canExpand` returns true get a chevron toggle in
  // a leading column; clicking it reveals `renderExpanded(row)` in a full-width
  // row underneath. Purely presentational.
  renderExpanded?: (row: T) => React.ReactNode;
  canExpand?: (row: T) => boolean;
}

export default function Table<T>({
  columns,
  data,
  emptyMessage = "Nenhum registro encontrado",
  rowKey,
  onRowClick,
  className = "",
  renderExpanded,
  canExpand,
}: TableProps<T>) {
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set());
  const expandable = Boolean(renderExpanded);
  const rowCanExpand = (row: T) =>
    expandable && (canExpand ? canExpand(row) : true);

  const toggle = (key: string | number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const totalCols = columns.length + (expandable ? 1 : 0);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-hairline bg-card ${className}`}
    >
      <div className="w-full overflow-x-auto">
        <table className="min-w-[640px] w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-shell">
              {expandable && <th className="w-10" />}
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  className={`whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-cream-muted ${
                    col.className || ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={totalCols}
                  className="px-4 py-14 text-center text-[13px] text-ink-subtle"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = rowKey(row);
                const canOpen = rowCanExpand(row);
                const isOpen = canOpen && expanded.has(key);
                return (
                  <React.Fragment key={key}>
                    <tr
                      className={`border-b border-hairline transition-colors ${
                        isOpen ? "" : "last:border-b-0"
                      } ${
                        onRowClick
                          ? "cursor-pointer hover:bg-card-alt"
                          : "hover:bg-card-alt/60"
                      }`}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {expandable && (
                        <td className="px-2 py-2.5 align-middle">
                          {canOpen && (
                            <button
                              type="button"
                              aria-label={isOpen ? "Recolher" : "Expandir"}
                              aria-expanded={isOpen}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggle(key);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-card-alt hover:text-brand-600"
                            >
                              <ChevronRight
                                size={16}
                                className={`transition-transform ${
                                  isOpen ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                          )}
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key as string}
                          className={`px-4 py-2.5 align-middle text-ink ${
                            col.className || ""
                          }`}
                        >
                          {col.render
                            ? col.render(row)
                            : (row[col.key as keyof T] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-hairline last:border-b-0 bg-shell">
                        <td colSpan={totalCols} className="px-4 py-3">
                          {renderExpanded!(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
