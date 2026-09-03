import React from "react";
import { Eye } from "lucide-react";
import Table from "../atoms/Table";

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getId?: (row: T) => string | number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  /**
   * When set, a "view record" eye button is prepended as the first column
   * and clicking a row also triggers it.
   */
  onView?: (row: T) => void;
  viewLabel?: string;
  className?: string;
  /** Presentational row expansion — see Table. */
  renderExpanded?: (row: T) => React.ReactNode;
  canExpand?: (row: T) => boolean;
}

export default function DataTable<T>({
  data,
  columns,
  getId,
  emptyMessage,
  onRowClick,
  onView,
  viewLabel = "Visualizar",
  className,
  renderExpanded,
  canExpand,
}: DataTableProps<T>) {
  const rowKey =
    getId ||
    ((row: T) => {
      return (row as { id?: string | number }).id ?? String(Math.random());
    });

  const allColumns: DataTableColumn<T>[] = onView
    ? [
        {
          key: "__view",
          label: "",
          className: "w-10",
          render: (row: T) => (
            <button
              type="button"
              title={viewLabel}
              aria-label={viewLabel}
              onClick={(event) => {
                event.stopPropagation();
                onView(row);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-card-alt hover:text-brand-600"
            >
              <Eye size={16} />
            </button>
          ),
        },
        ...columns,
      ]
    : columns;

  return (
    <Table
      columns={allColumns}
      data={data}
      rowKey={rowKey}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick ?? onView}
      className={className}
      renderExpanded={renderExpanded}
      canExpand={canExpand}
    />
  );
}
