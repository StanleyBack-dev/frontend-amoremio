import PageHeader from "@atoms/PageHeader";
import SearchBar from "@atoms/SearchBar";
import { useState } from "react";
import { Menu } from "lucide-react";

import type { ActiveView } from "../../types/views";
import { useAuthSession } from "../../features/auth";
import { useStoreContext } from "../../features/stores";
import {
  primaryNavigationItems,
  secondaryNavigationItems,
  settingsPageItems,
  viewTitles,
} from "../../router/navigation";

// Views whose data is scoped to the active store — the store name is
// appended to the header subtitle so it's clear which store is in context.
const STORE_SCOPED_VIEWS: ActiveView[] = [
  "dashboard",
  "products",
  "brands",
  "inventory",
  "purchases",
  "sales",
];

interface HeaderProps {
  activeView: ActiveView;
  search?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
  onNavigate?: (view: ActiveView) => void;
  onMenuClick?: () => void;
}

export default function Header({
  activeView,
  onNavigate,
  onMenuClick,
}: HeaderProps) {
  const { hasPageAccess } = useAuthSession();
  const { activeStore } = useStoreContext();

  const info = viewTitles[activeView as keyof typeof viewTitles] || {
    title: "Painel",
    subtitle: "",
  };
  const subtitle =
    STORE_SCOPED_VIEWS.includes(activeView) && activeStore?.name
      ? `${info.subtitle} · ${activeStore.name}`
      : info.subtitle;
  const [search, setSearch] = useState("");
  const sidebarItems = [
    ...primaryNavigationItems.filter((item) => hasPageAccess(item.id)),
    ...secondaryNavigationItems.filter((item) => hasPageAccess(item.id)),
    ...settingsPageItems,
  ];
  const filtered =
    search.length > 0
      ? sidebarItems.filter((item) =>
          item.label.toLowerCase().includes(search.toLowerCase()),
        )
      : [];

  return (
    <>
      <PageHeader
        title={info.title}
        subtitle={subtitle}
        actions={
          <>
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline-strong bg-card text-ink-muted hover:text-ink lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Procurar menus..."
              />
              {filtered.length > 0 && (
                <div className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-hairline bg-card shadow-pop">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-ink-muted hover:bg-card-alt hover:text-ink"
                      onClick={() => {
                        setSearch("");
                        if (onNavigate) onNavigate(item.id as ActiveView);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {item.label}
                        {item.icon}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        }
      />
    </>
  );
}
