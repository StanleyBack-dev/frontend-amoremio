import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

interface TableColumn<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  /**
   * Overrides `render` only for the mobile card's title/subtitle line; the
   * desktop cell and the mobile detail list keep using `render`.
   */
  mobileRender?: (row: T) => React.ReactNode;
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

// Columns holding row controls rather than data — kept out of the mobile card's
// title/subtitle/detail derivation and pinned to the card header instead.
const CONTROL_KEYS = new Set(["actions", "__view"]);

function cellValue<T>(col: TableColumn<T>, row: T): React.ReactNode {
  return col.render
    ? col.render(row)
    : (row[col.key as keyof T] as React.ReactNode);
}

function mobileHeaderValue<T>(col: TableColumn<T>, row: T): React.ReactNode {
  return col.mobileRender ? col.mobileRender(row) : cellValue(col, row);
}

function MobileCard<T>({
  row,
  titleColumn,
  subtitleColumn,
  detailColumns,
  controlColumns,
  onRowClick,
  expandedContent,
}: {
  row: T;
  titleColumn?: TableColumn<T>;
  subtitleColumn?: TableColumn<T>;
  detailColumns: TableColumn<T>[];
  controlColumns: TableColumn<T>[];
  onRowClick?: (row: T) => void;
  // Custom expansion body (from the parent's `renderExpanded`); when present it
  // replaces the derived label/value detail list.
  expandedContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hasDetails = expandedContent != null || detailColumns.length > 0;
  const interactive = hasDetails || Boolean(onRowClick);

  function handleToggle() {
    if (hasDetails) setOpen((current) => !current);
    onRowClick?.(row);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-card">
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? handleToggle : undefined}
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleToggle();
                }
              }
            : undefined
        }
        className={`flex w-full items-center gap-2 px-3 py-2.5 ${
          interactive
            ? "cursor-pointer transition-colors hover:bg-card-alt"
            : ""
        }`}
      >
        {hasDetails && (
          <ChevronRight
            size={16}
            className={`shrink-0 text-ink-subtle transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
        )}
        <div className="min-w-0 flex-1">
          {titleColumn && (
            <div className="truncate text-[13px] font-medium text-ink">
              {mobileHeaderValue(titleColumn, row)}
            </div>
          )}
          {subtitleColumn && (
            <div className="truncate text-[12px] text-ink-subtle">
              {mobileHeaderValue(subtitleColumn, row)}
            </div>
          )}
        </div>
        {controlColumns.length > 0 && (
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            {controlColumns.map((col) => (
              <React.Fragment key={col.key as string}>
                {cellValue(col, row)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {open &&
        (expandedContent != null ? (
          <div className="border-t border-hairline bg-shell p-3">
            {expandedContent}
          </div>
        ) : (
          <dl className="divide-y divide-hairline border-t border-hairline px-3">
            {detailColumns.map((col) => (
              <div
                key={col.key as string}
                className="flex items-baseline justify-between gap-3 py-2"
              >
                <dt className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
                  {col.label}
                </dt>
                <dd className="min-w-0 flex-1 break-words text-right text-[13px] text-ink">
                  {cellValue(col, row)}
                </dd>
              </div>
            ))}
          </dl>
        ))}
    </div>
  );
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

  // Mobile card layout: first data column is the title, second the subtitle,
  // the rest collapse into a label/value list behind a chevron.
  const controlColumns = columns.filter((col) =>
    CONTROL_KEYS.has(col.key as string),
  );
  const dataColumns = columns.filter(
    (col) => !CONTROL_KEYS.has(col.key as string),
  );
  const [titleColumn, subtitleColumn, ...detailColumns] = dataColumns;

  return (
    <div
      className={`overflow-hidden rounded-lg border border-hairline bg-card ${className}`}
    >
      {data.length === 0 ? (
        <p className="px-4 py-14 text-center text-[13px] text-ink-subtle">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 bg-card-alt p-2 sm:hidden">
            {data.map((row) => {
              const key = rowKey(row);
              return (
                <MobileCard
                  key={key}
                  row={row}
                  titleColumn={titleColumn}
                  subtitleColumn={subtitleColumn}
                  detailColumns={detailColumns}
                  controlColumns={controlColumns}
                  onRowClick={onRowClick}
                  expandedContent={
                    rowCanExpand(row) ? renderExpanded!(row) : undefined
                  }
                />
              );
            })}
          </div>

          <div className="hidden w-full overflow-x-auto sm:block">
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
                {data.map((row) => {
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
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
