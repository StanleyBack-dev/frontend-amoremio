import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalWidth = "sm" | "md" | "lg";

const widths: Record<ModalWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  width?: ModalWidth;
  children: ReactNode;
}

// Centered dialog. Used for small focused actions layered above another
// surface (e.g. creating a brand from inside the product form).
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  width = "md",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full ${widths[width]} overflow-hidden rounded-lg border border-hairline bg-card shadow-pop`}
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

        <div className="px-5 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-hairline bg-card-alt px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
