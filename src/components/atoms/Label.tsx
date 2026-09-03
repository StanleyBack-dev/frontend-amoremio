import React, { LabelHTMLAttributes } from "react";
import { fieldLabelClass } from "./field";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

export default function Label({
  children,
  className = "",
  ...props
}: LabelProps) {
  return (
    <label className={`${fieldLabelClass} ${className}`} {...props}>
      {children}
    </label>
  );
}
