// Shared class strings for form controls (Input, Select, Textarea,
// CurrencyInput, NumberInput). Light near-white fields with a gold focus
// ring — readable on both the light content area and the dark filter bars.

export const fieldLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted";

export const fieldControlClass =
  "w-full rounded-md border border-hairline-strong bg-field px-3 text-[13px] text-ink placeholder:text-ink-subtle outline-none transition-colors " +
  "focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 " +
  "disabled:cursor-not-allowed disabled:bg-card-alt disabled:text-ink-subtle";

export const fieldControlHeight = "h-9";

export const fieldErrorClass =
  "border-err-border focus:border-err-fg focus:ring-err-fg/25";

export const fieldHintClass = "mt-1 text-[11px] text-ink-subtle";

export const fieldErrorTextClass = "mt-1 text-[11px] font-medium text-err-fg";
