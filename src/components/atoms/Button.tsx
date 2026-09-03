import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  // Solid bordô — the primary action.
  primary:
    "bg-brand-500 text-white border border-brand-600 hover:bg-brand-600 focus-visible:ring-brand/40",
  // Neutral light — secondary emphasis.
  secondary:
    "bg-card text-ink border border-hairline-strong hover:bg-card-alt hover:border-gold-400 focus-visible:ring-gold/40",
  danger:
    "bg-[#B23B43] text-white border border-[#9C333B] hover:bg-[#9C333B] focus-visible:ring-[#B23B43]/40",
  outline:
    "bg-transparent text-ink-muted border border-hairline-strong hover:border-gold-400 hover:text-ink hover:bg-card-alt focus-visible:ring-gold/40",
  ghost:
    "bg-transparent text-ink-muted border border-transparent hover:bg-card-alt hover:text-ink focus-visible:ring-gold/40",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-[13px]",
  lg: "h-11 px-6 text-sm",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      loading,
      children,
      className = "",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  ),
);

Button.displayName = "Button";
export default Button;
