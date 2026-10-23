import { memo } from "react";

import { Users } from "lucide-react";

import { MIN_PARTY_SIZE } from "../constants";
import { errorIdFor } from "../lib/a11y";
import { UNDERLINE_INPUT_CLASS } from "../styles";
import type { FieldBlurHandler, FieldChangeHandler } from "../types";
import { FieldShell } from "./FieldShell";

interface PartySizeFieldProps {
  value: string;
  error: string | undefined;
  max: number;
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
}

export const PartySizeField = memo(function PartySizeField({
  value,
  error,
  max,
  onChange,
  onBlur,
}: PartySizeFieldProps) {
  return (
    <FieldShell
      id="partySize"
      label="04. Party Size"
      error={error}
      icon={Users}
    >
      <input
        id="partySize"
        name="partySize"
        type="text"
        inputMode="numeric"
        pattern="\d*"
        autoComplete="off"
        min={MIN_PARTY_SIZE}
        max={max}
        placeholder="2"
        required
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorIdFor("partySize") : undefined}
        className={UNDERLINE_INPUT_CLASS}
      />
    </FieldShell>
  );
});
