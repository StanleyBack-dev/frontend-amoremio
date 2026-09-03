import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      data-tour-header
      className={`flex flex-col gap-3 border-b border-hairline bg-card px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      <div className="min-w-0">
        <h2 className="truncate text-[17px] font-semibold text-ink">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-ink-muted sm:text-[13px]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
