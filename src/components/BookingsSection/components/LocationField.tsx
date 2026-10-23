import { memo } from "react";

import { MapPin, RefreshCw } from "lucide-react";

import { errorIdFor } from "../lib/a11y";
import { cx } from "../lib/cx";
import { ICON_CLASS, LABEL_CLASS, UNDERLINE_INPUT_CLASS } from "../styles";
import type {
  FieldBlurHandler,
  FieldChangeHandler,
  Location,
  LocationsStatus,
} from "../types";
import { FieldError } from "./FieldError";

interface LocationFieldProps {
  value: string;
  error: string | undefined;
  locations: readonly Location[];
  status: LocationsStatus;
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
  onRetry: () => void;
}

export const LocationField = memo(function LocationField({
  value,
  error,
  locations,
  status,
  onChange,
  onBlur,
  onRetry,
}: LocationFieldProps) {
  return (
    <div className="group space-y-4 md:col-span-2">
      <label htmlFor="locationId" className={LABEL_CLASS}>
        01. Select Location
      </label>

      {status === "error" ? (
        <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-4">
          <span className="text-xs font-bold text-red-500">
            Couldn&apos;t load locations.
          </span>

          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <RefreshCw size={12} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <div className="relative">
          <MapPin className={ICON_CLASS} size={18} aria-hidden="true" />

          <select
            id="locationId"
            name="locationId"
            required
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={status !== "ready"}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorIdFor("locationId") : undefined}
            className={cx(
              UNDERLINE_INPUT_CLASS,
              "cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {status === "loading" && (
              <option value="">Loading locations&hellip;</option>
            )}

            {status === "empty" && (
              <option value="">No locations available</option>
            )}

            {locations.map((location) => (
              <option
                key={location.id}
                value={location.id}
                className="bg-white dark:bg-black"
              >
                {location.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <FieldError fieldId="locationId" message={error} />
    </div>
  );
});
