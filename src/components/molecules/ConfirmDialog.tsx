import { useEffect, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@atoms/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "warning" | "danger";
  icon?: ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const badgeStyles: Record<NonNullable<ConfirmDialogProps["variant"]>, string> = {
  default: "border-gold-300 bg-gold-100 text-gold-700",
  warning: "border-warn-border bg-warn-bg text-warn-fg",
  danger: "border-err-border bg-err-bg text-err-fg",
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-hairline bg-card shadow-pop">
        <div className="flex items-start gap-4 p-5 pb-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${badgeStyles[variant]}`}
          >
            {icon ?? <AlertTriangle size={18} />}
          </div>
          <h2 className="min-w-0 flex-1 pt-1.5 text-[15px] font-semibold text-ink">
            {title}
          </h2>
        </div>

        <div className="px-5 pb-5 text-[13px] leading-relaxed text-ink-muted">
          {description}
        </div>

        <div className="flex justify-end gap-2 border-t border-hairline bg-card-alt px-5 py-3.5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
