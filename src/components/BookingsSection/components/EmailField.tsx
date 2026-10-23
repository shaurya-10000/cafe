import { memo } from "react";

import { Mail } from "lucide-react";

import { errorIdFor } from "../lib/a11y";
import { UNDERLINE_INPUT_CLASS } from "../styles";
import type { FieldBlurHandler, FieldChangeHandler } from "../types";
import { FieldShell } from "./FieldShell";

interface EmailFieldProps {
  value: string;
  error: string | undefined;
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
}

export const EmailField = memo(function EmailField({
  value,
  error,
  onChange,
  onBlur,
}: EmailFieldProps) {
  return (
    <FieldShell
      id="email"
      label="05. Your Email"
      error={error}
      icon={Mail}
    >
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="hello@example.com"
        required
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorIdFor("email") : undefined}
        className={UNDERLINE_INPUT_CLASS}
      />
    </FieldShell>
  );
});
