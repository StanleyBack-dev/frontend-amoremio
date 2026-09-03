import { useId, useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

interface FilterPanelProps {
  /** Fields (grid, clear button, …) revealed when the panel is expanded. */
  children: ReactNode;
  /** Trigger caption shown next to the icon. */
  label?: string;
  /**
   * Whether the panel starts expanded. Defaults to `false` so every list
   * page opens with its filters collapsed.
   */
  defaultOpen?: boolean;
  /** Marks the trigger (e.g. with a dot) when at least one filter is set. */
  hasActiveFilters?: boolean;
  /** Extra classes for the outer container. */
  className?: string;
}

// Collapsible wrapper for a page's filter fields. The trigger sits centered
// above the fields; the panel is collapsed by default and toggles on click,
// following the shared `.filter-panel` chrome used across the app.
export default function FilterPanel({
  children,
  label = "Filtros",
  defaultOpen = false,
  hasActiveFilters = false,
  className = "",
}: FilterPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();

  return (
    <div
      className={`filter-panel mb-4 rounded-lg border border-shell-line bg-shell p-3 ${className}`}
    >
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={regionId}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-muted transition-colors hover:bg-white/10 hover:text-cream"
        >
          <SlidersHorizontal size={14} />
          <span>{label}</span>
          {hasActiveFilters && (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-gold-400"
            />
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {open && (
        <div id={regionId} className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}
