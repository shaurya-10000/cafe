import { memo, useMemo } from "react";

import { Armchair, Sparkles } from "lucide-react";

import { cx } from "../lib/cx";
import { UNDERLINE_INPUT_CLASS } from "../styles";
import type {
  FieldBlurHandler,
  FieldChangeHandler,
  ResourceOption,
  ServiceOption,
} from "../types";
import { FieldShell } from "./FieldShell";

interface ServiceResourceFieldsProps {
  locationId: string;
  catalogItemId: string;
  resourceId: string;
  services: readonly ServiceOption[];
  resources: readonly ResourceOption[];
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
}

export const ServiceResourceFields = memo(function ServiceResourceFields({
  locationId,
  catalogItemId,
  resourceId,
  services,
  resources,
  onChange,
  onBlur,
}: ServiceResourceFieldsProps) {
  const locationResources = useMemo(
    () => resources.filter((r) => r.location_id === locationId),
    [locationId, resources],
  );

  if (services.length === 0 && locationResources.length === 0) {
    return null;
  }

  return (
    <>
      {services.length > 0 && (
        <FieldShell
          id="catalogItemId"
          label="Service (Optional)"
          error={undefined}
          icon={Sparkles}
        >
          <select
            id="catalogItemId"
            name="catalogItemId"
            value={catalogItemId}
            onChange={onChange}
            onBlur={onBlur}
            className={cx(UNDERLINE_INPUT_CLASS, "cursor-pointer appearance-none")}
          >
            <option value="" className="bg-white dark:bg-black">
              Standard Table Booking
            </option>
            {services.map((service) => (
              <option
                key={service.id}
                value={service.id}
                className="bg-white dark:bg-black"
              >
                {service.name}
                {service.duration_minutes ? ` (${service.duration_minutes} min)` : ""}
              </option>
            ))}
          </select>
        </FieldShell>
      )}

      {locationResources.length > 0 && (
        <FieldShell
          id="resourceId"
          label="Table / Spot (Optional)"
          error={undefined}
          icon={Armchair}
        >
          <select
            id="resourceId"
            name="resourceId"
            value={resourceId}
            onChange={onChange}
            onBlur={onBlur}
            className={cx(UNDERLINE_INPUT_CLASS, "cursor-pointer appearance-none")}
          >
            <option value="" className="bg-white dark:bg-black">
              Any Available Table
            </option>
            {locationResources.map((resource) => (
              <option
                key={resource.id}
                value={resource.id}
                className="bg-white dark:bg-black"
              >
                {resource.name}
              </option>
            ))}
          </select>
        </FieldShell>
      )}
    </>
  );
});