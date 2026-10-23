import { memo } from "react";

import { Clock } from "lucide-react";

import { errorIdFor } from "../lib/a11y";
import { UNDERLINE_INPUT_CLASS } from "../styles";
import type { FieldBlurHandler, FieldChangeHandler } from "../types";
import { FieldShell } from "./FieldShell";

interface TimeFieldProps {
  value: string;
  error: string | undefined;
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
}

export const TimeField = memo(function TimeField({
  value,
  error,
  onChange,
  onBlur,
}: TimeFieldProps) {
  return (
    <FieldShell
      id="time"
      label="03. Arrival Time"
      error={error}
      icon={Clock}
    >
      <input
        id="time"
        name="time"
        type="time"
        required
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorIdFor("time") : undefined}
        className={UNDERLINE_INPUT_CLASS}
      />
    </FieldShell>
  );
});
