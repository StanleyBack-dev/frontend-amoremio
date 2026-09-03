import React, { InputHTMLAttributes, useState } from "react";
import {
  formatDecimalForInput,
  maskDecimalInput,
  parseDecimalInput,
} from "../../utils/format";
import {
  fieldControlClass,
  fieldControlHeight,
  fieldErrorClass,
  fieldErrorTextClass,
  fieldHintClass,
  fieldLabelClass,
} from "./field";

interface NumberInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  label?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  error?: string;
  hint?: string;
  suffix?: string;
  maxDecimals?: number;
  value: number;
  onValueChange: (value: number) => void;
}

// Decimal field for quantities / conversion factors: digits plus a single
// comma, fractional part capped at `maxDecimals`. Everything else blocked.
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      wrapperClassName = "",
      labelClassName = "",
      error,
      hint,
      suffix,
      maxDecimals = 3,
      value,
      onValueChange,
      className = "",
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [text, setText] = useState(() =>
      formatDecimalForInput(value, maxDecimals),
    );
    const [focused, setFocused] = useState(false);
    const display = focused ? text : formatDecimalForInput(value, maxDecimals);

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
          <input
            ref={ref}
            {...props}
            inputMode="decimal"
            value={display}
            onFocus={(e) => {
              setFocused(true);
              setText(formatDecimalForInput(value, maxDecimals));
              props.onFocus?.(e);
            }}
            onChange={(e) => {
              const masked = maskDecimalInput(e.target.value, maxDecimals);
              setText(masked);
              onValueChange(parseDecimalInput(masked));
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            className={`${fieldControlClass} ${fieldControlHeight} text-right tabular-nums ${
              suffix ? "pr-12" : ""
            } ${error ? fieldErrorClass : ""} ${className}`}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-subtle">
              {suffix}
            </span>
          )}
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

NumberInput.displayName = "NumberInput";
export default NumberInput;
