import type { ReactNode } from "react";
import { ChevronRight, Crown } from "lucide-react";

interface SettingsLinkItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  showProBadge?: boolean;
  onClick: () => void;
}

export default function SettingsLinkItem({
  icon,
  title,
  description,
  showProBadge = false,
  onClick,
}: SettingsLinkItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-hairline bg-card p-4 text-left transition-colors duration-150 hover:border-gold-400 hover:bg-card-alt"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold-300 bg-gold-100 text-gold-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] text-ink-muted">{description}</p>
      </div>
      {showProBadge && <Crown size={16} className="shrink-0 text-gold-600" />}
      <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
    </button>
  );
}
