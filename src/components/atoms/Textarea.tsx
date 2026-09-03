// Atom: Textarea
import React, { TextareaHTMLAttributes } from "react";
import {
  fieldControlClass,
  fieldErrorTextClass,
  fieldLabelClass,
} from "./field";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      labelClassName = "",
      wrapperClassName = "",
      error,
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
      <textarea
        ref={ref}
        {...props}
        className={`${fieldControlClass} min-h-[84px] resize-y py-2 ${className}`}
      />
      {error && <div className={fieldErrorTextClass}>{error}</div>}
    </div>
  ),
);

Textarea.displayName = "Textarea";
export default Textarea;
