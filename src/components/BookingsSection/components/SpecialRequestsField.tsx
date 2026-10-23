import { memo } from "react";

import { MessageSquare } from "lucide-react";

import { SPECIAL_REQUESTS_MAX_LENGTH } from "../constants";
import { errorIdFor } from "../lib/a11y";
import { cx } from "../lib/cx";
import { TEXTAREA_ICON_CLASS, UNDERLINE_INPUT_CLASS } from "../styles";
import type { FieldBlurHandler, FieldChangeHandler } from "../types";
import { FieldShell } from "./FieldShell";

interface SpecialRequestsFieldProps {
  value: string;
  error: string | undefined;
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
}

export const SpecialRequestsField = memo(function SpecialRequestsField({
  value,
  error,
  onChange,
  onBlur,
}: SpecialRequestsFieldProps) {
  const remaining = Math.max(0, SPECIAL_REQUESTS_MAX_LENGTH - value.length);

  return (
    <FieldShell
      id="specialRequests"
      className="md:col-span-2"
      labelClassName="flex items-center justify-between"
      label={
        <>
          <span>06. Special Requests (Optional)</span>

          <span className="font-bold normal-case tracking-normal text-zinc-300 dark:text-zinc-700">
            {remaining} left
          </span>
        </>
      }
      error={error}
      icon={MessageSquare}
      iconClassName={TEXTAREA_ICON_CLASS}
    >
      <textarea
        id="specialRequests"
        name="specialRequests"
        rows={2}
        maxLength={SPECIAL_REQUESTS_MAX_LENGTH}
        placeholder={"Window seat, allergy notes, celebration\u2026"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorIdFor("specialRequests") : undefined}
        className={cx(UNDERLINE_INPUT_CLASS, "resize-none")}
      />
    </FieldShell>
  );
});
