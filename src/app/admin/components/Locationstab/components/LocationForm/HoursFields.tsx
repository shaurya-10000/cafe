import { memo } from "react";

import { Clock } from "lucide-react";

import { FORM_DEFAULTS } from "../../constants";
import { ariaErrorProps, firstError } from "../../lib/fieldErrors";
import { HINT_CLASS, INPUT_CLASS } from "../../styles";
import type { AdminLocation, FieldErrors } from "../../types";
import { FieldBlock } from "./FieldBlock";

interface HoursFieldsProps {
  location: AdminLocation | null;
  fieldErrors: FieldErrors;
}

export const HoursFields = memo(function HoursFields({
  location,
  fieldErrors,
}: HoursFieldsProps) {
  const weekdayError = firstError(fieldErrors, "hoursWeekday");
  const weekendError = firstError(fieldErrors, "hoursWeekend");

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
        <Clock size={12} aria-hidden="true" /> Hours
      </legend>

      <FieldBlock
        id="location-hours-weekday"
        label="Weekday hours"
        error={weekdayError}
      >
        <input
          id="location-hours-weekday"
          name="hoursWeekday"
          type="text"
          defaultValue={location?.hoursWeekday ?? FORM_DEFAULTS.hoursWeekday}
          placeholder="e.g. Mon-Fri: 9am - 6pm"
          className={INPUT_CLASS}
          required
          maxLength={200}
          {...ariaErrorProps("location-hours-weekday", weekdayError)}
        />
      </FieldBlock>

      <FieldBlock
        id="location-hours-weekend"
        label="Weekend hours"
        error={weekendError}
      >
        <input
          id="location-hours-weekend"
          name="hoursWeekend"
          type="text"
          defaultValue={location?.hoursWeekend ?? FORM_DEFAULTS.hoursWeekend}
          placeholder="e.g. Sat-Sun: 10am - 4pm"
          className={INPUT_CLASS}
          required
          maxLength={200}
          {...ariaErrorProps("location-hours-weekend", weekendError)}
        />
      </FieldBlock>

      <p className={HINT_CLASS}>
        Free-text display hours. There&apos;s no per-day schedule in this
        database &mdash; these two lines are exactly what customers see.
      </p>
    </fieldset>
  );
});
