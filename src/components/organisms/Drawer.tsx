import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type DrawerWidth = "sm" | "md" | "lg" | "xl";

const widths: Record<DrawerWidth, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Sticky footer, usually the action buttons. */
  footer?: ReactNode;
  width?: DrawerWidth;
  children: ReactNode;
}

// Right-side slide-over panel used for viewing / editing / creating records
// across the app (iFood-admin style). Full-width on mobile, a fixed panel
// on larger screens.
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  width = "md",
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 flex w-full ${widths[width]} flex-col border-l border-hairline bg-card shadow-pop transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline bg-shell px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-cream">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-[12px] text-cream-muted">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-cream-subtle transition-colors hover:bg-white/10 hover:text-cream"
          >
            <X size={18} />
          </button>
        </div>

        <div className="content-scroll flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-hairline bg-card-alt px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
