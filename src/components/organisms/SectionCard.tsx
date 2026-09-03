import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Renders the title as a toggle that collapses/expands the body. */
  collapsible?: boolean;
  /** Initial expanded state when `collapsible` is set. Defaults to closed. */
  defaultOpen?: boolean;
}

export default function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "",
  collapsible = false,
  defaultOpen = false,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  const expanded = !collapsible || open;

  return (
    <section
      className={`overflow-hidden rounded-lg border border-hairline bg-card shadow-card ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-col gap-3 border-b border-hairline px-4 py-3.5 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {title &&
              (collapsible ? (
                <button
                  type="button"
                  onClick={() => setOpen((value) => !value)}
                  aria-expanded={open}
                  aria-controls={regionId}
                  className="flex items-center gap-2 text-left"
                >
                  <h3 className="text-[15px] font-semibold text-ink">
                    {title}
                  </h3>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-subtle transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
              ))}
            {description && (
              <p className="mt-1 text-[13px] leading-5 text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {expanded && (
        <div
          id={collapsible ? regionId : undefined}
          className={`px-4 py-4 sm:px-5 ${bodyClassName}`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
