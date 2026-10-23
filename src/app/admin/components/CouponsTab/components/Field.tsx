import type { ReactNode } from "react";

import { cx } from "../lib/cx";

interface FieldProps {
  label: ReactNode;
  labelClassName: string;
  className?: string;
  children: ReactNode;
}

/** Label wrapping its control, so clicking the text focuses the input. */
export function Field({ label, labelClassName, className, children }: FieldProps) {
  return (
    <label className={cx("block space-y-1", className)}>
      <span className={labelClassName}>{label}</span>

      {children}
    </label>
  );
}
