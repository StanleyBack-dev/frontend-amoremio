import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "",
}: SectionCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-hairline bg-card shadow-card ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-col gap-3 border-b border-hairline px-4 py-3.5 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
            )}
            {description && (
              <p className="mt-1 text-[13px] leading-5 text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={`px-4 py-4 sm:px-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
