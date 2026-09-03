import type { ReactNode } from "react";

type BadgeTone =
  | "neutral"
  | "brand"
  | "gold"
  | "success"
  | "danger"
  | "warning"
  | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "border-hairline-strong bg-card-alt text-ink-muted",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  gold: "border-gold-300 bg-gold-100 text-gold-700",
  success: "border-ok-border bg-ok-bg text-ok-fg",
  danger: "border-err-border bg-err-bg text-err-fg",
  warning: "border-warn-border bg-warn-bg text-warn-fg",
  info: "border-info-border bg-info-bg text-info-fg",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export default function Badge({
  children,
  tone = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export type { BadgeTone };
