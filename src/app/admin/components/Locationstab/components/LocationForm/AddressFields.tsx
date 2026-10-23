import { memo } from "react";

import { Phone } from "lucide-react";

import { FORM_DEFAULTS, IANA_TIMEZONE_SUGGESTIONS } from "../../constants";
import { ariaErrorProps, firstError } from "../../lib/fieldErrors";
import { cx } from "../../lib/cx";
import { HINT_CLASS, INPUT_CLASS, LEGEND_CLASS } from "../../styles";
import type { AdminLocation, FieldErrors } from "../../types";
import { FieldBlock } from "./FieldBlock";

interface AddressFieldsProps {
  location: AdminLocation | null;
  fieldErrors: FieldErrors;
}

export const AddressFields = memo(function AddressFields({
  location,
  fieldErrors,
}: AddressFieldsProps) {
  const addressError = firstError(fieldErrors, "address");
  const latitudeError = firstError(fieldErrors, "latitude");
  const longitudeError = firstError(fieldErrors, "longitude");
  const timezoneError = firstError(fieldErrors, "timezone");

  return (
    <fieldset className="space-y-4">
      <legend className={LEGEND_CLASS}>Address</legend>

      <FieldBlock id="location-address" label="Address" error={addressError}>
        <textarea
          id="location-address"
          name="address"
          defaultValue={location?.address ?? ""}
          placeholder="Full Street Address"
          className={cx(INPUT_CLASS, "min-h-[70px] resize-none")}
          required
          minLength={1}
          {...ariaErrorProps("location-address", addressError)}
        />
      </FieldBlock>

      <div className="grid grid-cols-2 gap-4">
        <FieldBlock id="location-lat" label="Latitude" error={latitudeError}>
          <input
            id="location-lat"
            name="latitude"
            type="number"
            step="any"
            defaultValue={location?.latitude ?? ""}
            placeholder="Latitude"
            className={INPUT_CLASS}
            required
            {...ariaErrorProps("location-lat", latitudeError)}
          />
        </FieldBlock>

        <FieldBlock id="location-lng" label="Longitude" error={longitudeError}>
          <input
            id="location-lng"
            name="longitude"
            type="number"
            step="any"
            defaultValue={location?.longitude ?? ""}
            placeholder="Longitude"
            className={INPUT_CLASS}
            required
            {...ariaErrorProps("location-lng", longitudeError)}
          />
        </FieldBlock>
      </div>

      <p className={cx("-mt-2", HINT_CLASS)}>
        Tip: right-click the spot on Google Maps and copy the lat/long shown at
        the top.
      </p>

      <FieldBlock
        id="location-timezone"
        label="Timezone"
        error={timezoneError}
        hint="Used for booking-time calculations at this location."
      >
        <input
          id="location-timezone"
          name="timezone"
          type="text"
          list="timezone-suggestions"
          defaultValue={location?.timezone ?? FORM_DEFAULTS.timezone}
          placeholder="IANA timezone (e.g. Asia/Kolkata)"
          className={cx(INPUT_CLASS, "font-mono")}
          required
          {...ariaErrorProps("location-timezone", timezoneError)}
        />

        <datalist id="timezone-suggestions">
          {IANA_TIMEZONE_SUGGESTIONS.map((timezone) => (
            <option key={timezone} value={timezone} />
          ))}
        </datalist>
      </FieldBlock>

      <div className="relative">
        <Phone
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          size={14}
          aria-hidden="true"
        />

        <label htmlFor="location-phone" className="sr-only">
          Phone number
        </label>

        <input
          id="location-phone"
          name="phone"
          type="tel"
          defaultValue={location?.phone ?? ""}
          placeholder="Phone Number"
          className={cx(INPUT_CLASS, "pl-11")}
        />
      </div>
    </fieldset>
  );
});
