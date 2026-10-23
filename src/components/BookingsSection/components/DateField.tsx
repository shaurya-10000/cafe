import { memo } from "react";

import { Calendar } from "lucide-react";

import { errorIdFor } from "../lib/a11y";
import { UNDERLINE_INPUT_CLASS } from "../styles";
import type { FieldBlurHandler, FieldChangeHandler } from "../types";
import { FieldShell } from "./FieldShell";

interface DateFieldProps {
  value: string;
  error: string | undefined;
  min: string;
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
  onFocus: () => void;
}

export const DateField = memo(function DateField({
  value,
  error,
  min,
  onChange,
  onBlur,
  onFocus,
}: DateFieldProps) {
  return (
    <FieldShell
      id="date"
      label="02. Pick a Date"
      error={error}
      icon={Calendar}
    >
      <input
        id="date"
        name="date"
        type="date"
        required
        min={min}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorIdFor("date") : undefined}
        className={UNDERLINE_INPUT_CLASS}
      />
    </FieldShell>
  );
});
