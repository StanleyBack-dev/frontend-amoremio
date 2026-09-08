interface TooltipRow {
  key: string;
  label: string;
  value: string;
  color: string;
}

interface ChartTooltipProps {
  title?: string;
  rows: TooltipRow[];
}

// Shared readout for every chart: a short stroke keys each row to its
// series color (never a filled swatch — that's data-weight ink at tooltip
// density), and the value leads since the reader already has the series.
export default function ChartTooltip({ title, rows }: ChartTooltipProps) {
  if (rows.length === 0) return null;
  return (
    <div className="min-w-[160px] rounded-md border border-hairline-strong bg-card px-3 py-2 shadow-pop">
      {title && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 text-[12.5px]"
          >
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span
                className="h-[2px] w-3 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              {row.label}
            </span>
            <span className="font-semibold text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
