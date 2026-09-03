// Atom: Checkbox
import React, { InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  wrapperClassName?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, wrapperClassName = "", className = "", ...props }, ref) => (
    <label
      className={`flex cursor-pointer items-start gap-2.5 ${wrapperClassName}`}
    >
      <input
        ref={ref}
        type="checkbox"
        {...props}
        className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-hairline-strong accent-brand-500 focus:ring-2 focus:ring-gold-500/30 ${className}`}
      />
      <span className="text-[13px] leading-snug text-ink">{label}</span>
    </label>
  ),
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
