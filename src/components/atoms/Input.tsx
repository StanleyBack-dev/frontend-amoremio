// Atom: Input
import React, { InputHTMLAttributes } from "react";
import {
  fieldControlClass,
  fieldControlHeight,
  fieldErrorClass,
  fieldErrorTextClass,
  fieldLabelClass,
} from "./field";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: string;
  trailing?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelClassName = "",
      wrapperClassName = "",
      error,
      trailing,
      className = "",
      ...props
    },
    ref,
  ) => (
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
          className={`${fieldControlClass} ${fieldControlHeight} ${
            trailing ? "pr-10" : ""
          } ${error ? fieldErrorClass : ""} ${className}`}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        )}
      </div>
      {error && <div className={fieldErrorTextClass}>{error}</div>}
    </div>
  ),
);

Input.displayName = "Input";
export default Input;
