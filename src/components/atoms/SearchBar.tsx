import React, { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  icon,
  ...props
}: SearchBarProps) {
  return (
    <div
      className={`flex h-9 w-full items-center gap-2 rounded-md border border-hairline-strong bg-field px-3 transition-colors focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/30 ${className}`}
    >
      <span className="text-ink-subtle">{icon ?? <Search size={15} />}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-subtle outline-none"
        {...props}
      />
    </div>
  );
}
