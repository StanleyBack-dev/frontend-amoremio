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

  // Lock the page's own scroll while the mobile drawer is open — otherwise a
  // touch scroll that reaches the sidebar's own scroll boundary chains into
  // the page behind it, which on mobile browsers also jumps/clips the layout
  // as the toolbar shows or hides mid-gesture. Pinning `body` via `position:
  // fixed` (rather than just `overflow: hidden`) is what actually blocks
  // touch-driven scrolling on iOS Safari.
  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;
    const previousOverflow = body.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      body.style.overflow = previousOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [mobileSidebarOpen]);

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
