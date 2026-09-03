import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CircleUserRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { brand } from "../../config";
import type { ActiveView } from "../../types/views";
import { logoutCurrentSession, useAuthSession } from "../../features/auth";
import { authRoutePaths } from "../../router";
import {
  accountNavigationItems,
  primaryNavigationItems,
  type NavigationItem,
} from "../../router/navigation";
import ConfirmDialog from "@molecules/ConfirmDialog";
import { useToast } from "../../shared/toast/useToast";
import { AuthApiError } from "../../api/auth/methods/http-error";

interface NavItemButtonProps {
  item: NavigationItem;
  isActive: boolean;
  collapsed: boolean;
  onSelect: () => void;
}

function NavItemButton({
  item,
  isActive,
  collapsed,
  onSelect,
}: NavItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={collapsed ? item.label : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-md py-2 text-[13px] font-medium transition-colors duration-150 ${
        collapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"
      } ${
        isActive
          ? "bg-brand-500/90 text-cream"
          : "text-cream-muted hover:bg-white/5 hover:text-cream"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold-400 transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
      <span
        className={
          isActive
            ? "text-gold-200"
            : "text-cream-subtle group-hover:text-gold-300"
        }
      >
        {item.icon}
      </span>
      <span className={`flex-1 text-left ${collapsed ? "lg:hidden" : ""}`}>
        {item.label}
      </span>
    </button>
  );
}

interface SidebarProps {
  active: ActiveView;
  onNavigate: (view: ActiveView) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  active,
  onNavigate,
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const navigate = useNavigate();
  const { session, hasPageAccess, clearSession } = useAuthSession();
  const { showSuccess, showError } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("amoremio:sidebarAccountOpen") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "amoremio:sidebarAccountOpen",
        accountOpen ? "1" : "0",
      );
    } catch {
      /* storage unavailable — the section just won't be remembered */
    }
  }, [accountOpen]);

  const visiblePrimaryItems = primaryNavigationItems.filter((item) =>
    hasPageAccess(item.id),
  );
  const visibleAccountItems = accountNavigationItems.filter((item) =>
    hasPageAccess(item.id),
  );
  const accountActive = visibleAccountItems.some((item) => item.id === active);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logoutCurrentSession();
      showSuccess("Sessão encerrada", "Logout realizado com sucesso.");
    } catch (error) {
      const message =
        error instanceof AuthApiError || error instanceof Error
          ? error.message
          : "Não foi possível encerrar a sessão no servidor.";

      showError("Logout parcial", message);
    } finally {
      clearSession();
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
      onClose?.();
      navigate(authRoutePaths.login, { replace: true });
    }
  }

  function select(view: ActiveView) {
    onNavigate(view);
    onClose?.();
  }

  const hideOnCollapse = collapsed ? "lg:hidden" : "";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 max-w-[85vw] flex-col border-r border-shell-line bg-gradient-to-b from-[#2A1216] via-[#20100F] to-[#1A0C0E] transition-[transform,width] duration-200 lg:max-w-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[68px]" : "lg:w-64"}`}
      >
        <div
          className={`flex items-center gap-3 border-b border-shell-line px-4 py-4 ${
            collapsed ? "lg:flex-col lg:gap-2 lg:px-2" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => select("profile")}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Ir para o perfil"
          >
            <img
              src="/amoremio-logo-96.png"
              alt={brand.name}
              className="h-10 w-10 shrink-0 rounded-full border border-gold-600/40 object-cover"
            />
            <div className={`min-w-0 ${hideOnCollapse}`}>
              <h1 className="font-display text-[18px] font-semibold leading-tight tracking-wide text-cream">
                Amore Mio
              </h1>
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-gold-400">
                {session?.user?.name || brand.subtitle}
              </p>
            </div>
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-cream-subtle transition-colors hover:bg-white/5 hover:text-cream lg:flex"
              aria-label={collapsed ? "Expandir menu" : "Encolher menu"}
              title={collapsed ? "Expandir menu" : "Encolher menu"}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          )}
        </div>

        <nav
          className={`sidebar-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden py-4 ${
            collapsed ? "lg:px-2 px-3" : "px-3"
          }`}
        >
          {visiblePrimaryItems.map((item) => (
            <NavItemButton
              key={item.id}
              item={item}
              isActive={active === item.id}
              collapsed={collapsed}
              onSelect={() => select(item.id)}
            />
          ))}
        </nav>

        <div
          className={`border-t border-shell-line py-3 ${
            collapsed ? "lg:px-2 px-3" : "px-3"
          }`}
        >
          {visibleAccountItems.length > 0 &&
            (collapsed ? (
              // Icon rail: no room for a sub-menu, so show the items directly.
              visibleAccountItems.map((item) => (
                <NavItemButton
                  key={item.id}
                  item={item}
                  isActive={active === item.id}
                  collapsed={collapsed}
                  onSelect={() => select(item.id)}
                />
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                    accountActive && !accountOpen
                      ? "text-cream"
                      : "text-cream-muted hover:bg-white/5 hover:text-cream"
                  }`}
                >
                  <CircleUserRound size={20} className="text-cream-subtle" />
                  <span className="flex-1 text-left">Conta</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      accountOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {accountOpen && (
                  <div className="mt-0.5 flex flex-col gap-0.5 border-l border-shell-line pl-3">
                    {visibleAccountItems.map((item) => (
                      <NavItemButton
                        key={item.id}
                        item={item}
                        isActive={active === item.id}
                        collapsed={false}
                        onSelect={() => select(item.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            ))}

          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            title={collapsed ? "Sair" : undefined}
            className={`mt-0.5 flex w-full items-center gap-3 rounded-md py-2 text-[13px] font-medium text-cream-muted transition-colors hover:bg-white/5 hover:text-cream ${
              collapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"
            }`}
          >
            <LogOut size={18} />
            <span className={`flex-1 text-left ${hideOnCollapse}`}>Sair</span>
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={isLogoutDialogOpen}
        title="Encerrar sessão"
        description="Você tem certeza que deseja sair do sistema?"
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        loading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </>
  );
}
