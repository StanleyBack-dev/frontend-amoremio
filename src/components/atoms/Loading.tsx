type LoadingProps = {
  size?: number;
  label?: string;
  className?: string;
};

export default function Loading({
  size = 20,
  label,
  className = "",
}: LoadingProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="animate-spin text-gold-400"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          strokeOpacity="0.25"
          fill="none"
        />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {label ? (
        <span className="text-[13px] font-medium text-ink-muted">{label}</span>
      ) : null}
    </div>
  );
}
