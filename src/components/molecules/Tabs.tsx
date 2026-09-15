import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

// Segmented-control tab bar — splits a long page into topics the user
// clicks through instead of scrolling past, same idea as the 99Food admin
// panel. Visually distinct from the pill filters in DateRangeFilter (those
// float free; this one lives inside a bordered track) so the two rows read
// as different kinds of controls at a glance.
export default function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="inline-flex w-full flex-wrap gap-1 rounded-lg border border-hairline bg-card-alt p-1 sm:w-auto"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              isActive
                ? "bg-card text-brand-600 shadow-card"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
