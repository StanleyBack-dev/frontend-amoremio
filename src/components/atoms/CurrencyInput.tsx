import React, { InputHTMLAttributes, useState } from "react";
import {
  formatCurrencyForInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../utils/format";
import {
  fieldControlClass,
  fieldControlHeight,
  fieldErrorClass,
  fieldErrorTextClass,
  fieldHintClass,
  fieldLabelClass,
} from "./field";

interface CurrencyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  label?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  error?: string;
  hint?: string;
  /** Numeric value in reais (e.g. 1234.56). */
  value: number;
  /** Fired with the parsed numeric value on every keystroke. */
  onValueChange: (value: number) => void;
}

// Currency field that only ever holds a pt-BR masked amount: digits fill in
// from the right as cents, everything else is blocked. Emits a number.
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      wrapperClassName = "",
      labelClassName = "",
      error,
      hint,
      value,
      onValueChange,
      className = "",
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [text, setText] = useState(() => formatCurrencyForInput(value));
    const [focused, setFocused] = useState(false);

    // While unfocused, stay in sync with the source of truth (form resets,
    // computed values). While focused, the local text drives.
    const display = focused ? text : formatCurrencyForInput(value);

    return (
      <div className={wrapperClassName}>
        {label && (
          <label className={`${fieldLabelClass} ${labelClassName}`}>
            {label}
            {props.required && (
              <span className="ml-0.5 text-err-fg" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-subtle">
            R$
          </span>
          <input
            ref={ref}
            {...props}
            inputMode="numeric"
            value={display}
            onFocus={(e) => {
              setFocused(true);
              setText(formatCurrencyForInput(value));
              props.onFocus?.(e);
            }}
            onChange={(e) => {
              const masked = maskCurrencyInput(e.target.value);
              setText(masked);
              onValueChange(parseCurrencyInput(masked));
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            className={`${fieldControlClass} ${fieldControlHeight} pl-9 text-right tabular-nums ${
              error ? fieldErrorClass : ""
            } ${className}`}
          />
        </div>
        {error ? (
          <div className={fieldErrorTextClass}>{error}</div>
        ) : hint ? (
          <div className={fieldHintClass}>{hint}</div>
        ) : null}
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
export default CurrencyInput;
