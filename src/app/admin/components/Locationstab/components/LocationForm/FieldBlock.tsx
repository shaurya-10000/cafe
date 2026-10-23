import type { ReactNode } from "react";

import { errorIdFor } from "../../lib/fieldErrors";
import { HINT_CLASS } from "../../styles";

interface FieldBlockProps {
  id: string;
  /** Visually hidden label (the placeholder is the visible hint). */
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Hidden label + control + optional hint + validation error. */
export function FieldBlock({
  id,
  label,
  error,
  hint,
  className,
  children,
}: FieldBlockProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      {children}

      {hint && <p className={`mt-1 ${HINT_CLASS}`}>{hint}</p>}

      {error && (
        <p
          id={errorIdFor(id)}
          role="alert"
          className="mt-1 text-xs text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
