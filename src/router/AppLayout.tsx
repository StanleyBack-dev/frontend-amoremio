import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/organisms/Sidebar";
import Header from "../components/organisms/Header";
import TermsAcceptanceGate from "../components/organisms/TermsAcceptanceGate";
import type { ActiveView } from "../types/views";
import { getActiveView, getPathForView } from "./navigation";

const COLLAPSE_STORAGE_KEY = "amoremio:sidebarCollapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);

  const activeView = useMemo(
    () => getActiveView(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore — collapse just won't persist
      }
      return next;
    });
  }

  function handleNavigate(view: ActiveView) {
    const path = getPathForView(view);

    if (path) {
      navigate(path);
    }
  }

  return (
    <>
      <div className="flex min-h-screen bg-page text-ink">
        <Sidebar
          active={activeView}
          onNavigate={handleNavigate}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <div
          className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${
            collapsed ? "lg:ml-[68px]" : "lg:ml-64"
          }`}
        >
          <Header
            activeView={activeView}
            onNavigate={handleNavigate}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <TermsAcceptanceGate />
    </>
  );
}
