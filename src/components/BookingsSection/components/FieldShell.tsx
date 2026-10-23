import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cx } from "../lib/cx";
import { ICON_CLASS, LABEL_CLASS } from "../styles";
import { FieldError } from "./FieldError";

interface FieldShellProps {
  id: string;
  label: ReactNode;
  error: string | undefined;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
}

/** Label + icon + control + error, shared by every underline field. */
export function FieldShell({
  id,
  label,
  error,
  icon: Icon,
  iconClassName = ICON_CLASS,
  className,
  labelClassName,
  children,
}: FieldShellProps) {
  return (
    <div className={cx("group space-y-4", className)}>
      <label htmlFor={id} className={cx(LABEL_CLASS, labelClassName)}>
        {label}
      </label>

      <div className="relative">
        <Icon className={iconClassName} size={18} aria-hidden="true" />

        {children}
      </div>

      <FieldError fieldId={id} message={error} />
    </div>
  );
}
