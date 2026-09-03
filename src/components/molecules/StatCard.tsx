import React from "react";

type StatCardTone = "light" | "dark";

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  sub?: React.ReactNode;
  color?: string;
  /** Kept for API compatibility. */
  tone?: StatCardTone;
  children?: React.ReactNode;
  className?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  valueColor,
  sub,
  color,
  children,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-hairline bg-card p-4 shadow-card sm:p-5 ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="pr-2 text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">
          {label}
        </p>
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gold-400/40 bg-gold-100 text-gold-600"
            style={color ? { color } : undefined}
          >
            {icon}
          </div>
        )}
      </div>
      <p
        className="mb-1 text-xl font-semibold text-ink sm:text-2xl"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-[12px] text-ink-subtle">{sub}</p>}
      {children}
    </div>
  );
}
