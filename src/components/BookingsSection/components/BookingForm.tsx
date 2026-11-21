import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
import type { FormEventHandler } from "react";

import { motion } from "framer-motion";

import type {
  BookingFormData,
  FieldBlurHandler,
  FieldChangeHandler,
  FormErrors,
  Location,
  LocationsStatus,
  ResourceOption,
  ServiceOption,
} from "../types";
import { DateField } from "./DateField";
import { EmailField } from "./EmailField";
import { LocationField } from "./LocationField";
import { PartySizeField } from "./PartySizeField";
import { ServiceResourceFields } from "./ServiceResourceFields";
import { SignInNotice } from "./SignInNotice";
import { SpecialRequestsField } from "./SpecialRequestsField";
import { SubmitButton } from "./SubmitButton";
import { SubmitErrorAlert } from "./SubmitErrorAlert";
import { TimeField } from "./TimeField";

interface BookingFormProps {
  headingId: string;
  motionEnabled: boolean;
  values: BookingFormData;
  errors: FormErrors;
  submitError: string | null;
  isSubmitting: boolean;
  /** Session is loaded and nobody is signed in. */
  isSignedOut: boolean;
  /** Session still loading, or nobody signed in. */
  isAuthBlocked: boolean;
  locations: readonly Location[];
  services?: readonly ServiceOption[];
  resources?: readonly ResourceOption[];
  locationsStatus: LocationsStatus;
  maxPartySize: number;
  isStoreOpen?: boolean;
  todayDate: string;
  onChange: FieldChangeHandler;
  onBlur: FieldBlurHandler;
  onDateFocus: () => void;
  onRetryLocations: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function BookingForm({
  headingId,
  motionEnabled,
  values,
  errors,
  submitError,
  isSubmitting,
  isSignedOut,
  isAuthBlocked,
  locations,
  locationsStatus,
  services = [],
  resources = [],
  maxPartySize,
  isStoreOpen = true,
  todayDate,
  onChange,
  onBlur,
  onDateFocus,
  onRetryLocations,
  onSubmit,
}: BookingFormProps) {
    const supabase = useSupabaseClient();
  const [closures, setClosures] = useState<Array<{ closed_on: string; reason: string | null }>>([]);
  const [openingHours, setOpeningHours] = useState<Array<{ day_of_week: number; open_time: string; close_time: string; is_closed: boolean }>>([]);

  useEffect(() => {
    if (!values.locationId) return;
    let cancelled = false;
    Promise.all([
      supabase
        .from("location_closures")
        .select("closed_on, reason")
        .eq("location_id", values.locationId),
      supabase
        .from("location_opening_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .eq("location_id", values.locationId),
    ]).then(([cRes, hRes]) => {
      if (cancelled) return;
      setClosures(Array.isArray(cRes.data) ? cRes.data : []);
      setOpeningHours(Array.isArray(hRes.data) ? hRes.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, values.locationId]);

  const scheduleNotice = useMemo(() => {
    if (!values.date) return null;
    const closure = closures.find((c) => c.closed_on === values.date);
    if (closure) {
      return {
        closed: true,
        text: closure.reason
          ? `This location is closed on ${values.date}: ${closure.reason}`
          : `This location is closed on ${values.date}.`,
      };
    }
    const day = new Date(`${values.date}T00:00:00`).getDay();
    const hours = openingHours.find((h) => h.day_of_week === day);
    if (hours?.is_closed) {
      return {
        closed: true,
        text: "This location is closed on the selected day of the week.",
      };
    }
    if (hours) {
      return {
        closed: false,
        text: `Branch hours for ${values.date}: ${hours.open_time.slice(0, 5)} – ${hours.close_time.slice(0, 5)}`,
      };
    }
    return null;
  }, [closures, openingHours, values.date]);

  const submitDisabled =
    isSubmitting || locationsStatus !== "ready" || !isStoreOpen || Boolean(scheduleNotice?.closed);

  return (
    <motion.form
      exit={motionEnabled ? { opacity: 0, y: -20 } : undefined}
      onSubmit={onSubmit}
      aria-labelledby={headingId}
      aria-busy={isSubmitting}
      noValidate
      className="space-y-10"
    >
      <h3 id={headingId} className="sr-only">
        Booking form
      </h3>

      {submitError && <SubmitErrorAlert message={submitError} />}

      {scheduleNotice && (
        <div
          role="status"
          className={`rounded-2xl border px-5 py-3 text-xs font-bold ${
            scheduleNotice.closed
              ? "border-red-500/30 bg-red-500/5 text-red-500"
              : "border-cafe-border bg-cafe-fg/5 text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {scheduleNotice.text}
        </div>
      )}

      {!isStoreOpen && (
        <div
          role="status"
          className="rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-xs font-bold text-red-500"
        >
          The cafe is currently closed — reservations are paused until we reopen.
        </div>
      )}

      {isSignedOut && <SignInNotice />}

      <fieldset disabled={isSubmitting} className="m-0 min-w-0 border-0 p-0">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          <LocationField
            value={values.locationId}
            error={errors.locationId}
            locations={locations}
            status={locationsStatus}
            onChange={onChange}
            onBlur={onBlur}
            onRetry={onRetryLocations}
          />

          <DateField
            value={values.date}
            error={errors.date}
            min={todayDate}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onDateFocus}
          />

          <TimeField
            value={values.time}
            error={errors.time}
            onChange={onChange}
            onBlur={onBlur}
          />

          <PartySizeField
            value={values.partySize}
            error={errors.partySize}
            max={maxPartySize}
            onChange={onChange}
            onBlur={onBlur}
          />

          <EmailField
            value={values.email}
            error={errors.email}
            onChange={onChange}
            onBlur={onBlur}
          />

          <ServiceResourceFields
            locationId={values.locationId}
            catalogItemId={values.catalogItemId}
            resourceId={values.resourceId}
            services={services}
            resources={resources}
            onChange={onChange}
            onBlur={onBlur}
          />

          <SpecialRequestsField
            value={values.specialRequests}
            error={errors.specialRequests}
            onChange={onChange}
            onBlur={onBlur}
          />
        </div>

        <SubmitButton
          isSubmitting={isSubmitting}
          disabled={submitDisabled}
          isAuthBlocked={isAuthBlocked}
          motionEnabled={motionEnabled}
        />
      </fieldset>
    </motion.form>
  );
}
