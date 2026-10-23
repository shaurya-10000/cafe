import { memo } from "react";

import { Users } from "lucide-react";

import { FORM_DEFAULTS } from "../../constants";
import { ariaErrorProps, firstError } from "../../lib/fieldErrors";
import { HINT_CLASS, INPUT_CLASS } from "../../styles";
import type { AdminLocation, FieldErrors } from "../../types";
import { FieldBlock } from "./FieldBlock";

interface CapacityFieldsProps {
  location: AdminLocation | null;
  fieldErrors: FieldErrors;
}

export const CapacityFields = memo(function CapacityFields({
  location,
  fieldErrors,
}: CapacityFieldsProps) {
  const capacityError = firstError(fieldErrors, "maxCapacity");
  const durationError = firstError(fieldErrors, "defaultBookingDurationMinutes");

  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
        <Users size={12} aria-hidden="true" /> Capacity &amp; Booking
      </legend>

      <div className="grid grid-cols-2 gap-4">
        <FieldBlock
          id="location-max-capacity"
          label="Max capacity"
          error={capacityError}
        >
          <input
            id="location-max-capacity"
            name="maxCapacity"
            type="number"
            min={1}
            step={1}
            defaultValue={location?.maxCapacity ?? FORM_DEFAULTS.maxCapacity}
            placeholder="Max capacity"
            className={INPUT_CLASS}
            required
            {...ariaErrorProps("location-max-capacity", capacityError)}
          />
        </FieldBlock>

        <FieldBlock
          id="location-booking-duration"
          label="Default booking duration (minutes)"
          error={durationError}
        >
          <input
            id="location-booking-duration"
            name="defaultBookingDurationMinutes"
            type="number"
            min={1}
            max={1440}
            step={1}
            defaultValue={
              location?.defaultBookingDurationMinutes ??
              FORM_DEFAULTS.defaultBookingDurationMinutes
            }
            placeholder="Duration (min)"
            className={INPUT_CLASS}
            required
            {...ariaErrorProps("location-booking-duration", durationError)}
          />
        </FieldBlock>
      </div>

      <p className={HINT_CLASS}>
        Default booking duration is only used for generic capacity bookings (no
        specific service selected) &mdash; a booked service&apos;s own duration
        always wins.
      </p>
    </fieldset>
  );
});
