import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

import { toast } from "sonner";

import { useSupabaseClient } from "@/utils/supabase/client";

import { insertBooking } from "../api/bookings";
import { verifyLocationActive } from "../api/locations";
import { mapSupabaseErrorToMessage } from "../lib/errors";
import { buildBookingPayload } from "../lib/payload";
import { hasFormErrors, validateBookingForm } from "../lib/validation";
import type {
  BookingFormData,
  BookingUser,
  ConfirmedSnapshot,
  FormErrors,
  Location,
  LocationsStatus,
} from "../types";
import { useIsMounted } from "./useIsMounted";

interface UseBookingSubmitOptions {
  user: BookingUser | null | undefined;
  isUserLoaded: boolean;
  values: BookingFormData;
  locations: readonly Location[];
  locationsStatus: LocationsStatus;
  maxPartySize: number;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  onRequireSignin: () => void;
}

export interface UseBookingSubmitResult {
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitError: string | null;
  confirmedSnapshot: ConfirmedSnapshot | null;
  clearSubmitError: () => void;
  /** Returns to the form (input is kept, only submit state is reset). */
  reset: () => void;
}

const LOCATION_UNAVAILABLE_MESSAGE =
  "That location is no longer available. Please select another.";

export function useBookingSubmit({
  user,
  isUserLoaded,
  values,
  locations,
  locationsStatus,
  maxPartySize,
  setErrors,
  onRequireSignin,
}: UseBookingSubmitOptions): UseBookingSubmitResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  /** Synchronous re-entry guard, set before any await. */
  const inFlightRef = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedSnapshot, setConfirmedSnapshot] =
    useState<ConfirmedSnapshot | null>(null);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const reset = useCallback(() => {
    setIsSubmitted(false);
    setConfirmedSnapshot(null);
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        if (!isUserLoaded) {
          toast.error("Still checking your session \u2014 try again in a moment.");
          return;
        }

        if (!user) {
          toast.error("Please sign in to make a booking.");
          onRequireSignin();
          return;
        }

        if (locationsStatus !== "ready") {
          const message =
            locationsStatus === "error"
              ? "Locations could not be loaded. Please retry."
              : locationsStatus === "empty"
                ? "No booking locations are currently available."
                : "Please wait while booking locations load.";

          setSubmitError(message);
          toast.error(message);
          return;
        }

        const validationErrors = validateBookingForm(
          values,
          new Date(),
          maxPartySize,
        );

        if (hasFormErrors(validationErrors)) {
          setErrors(validationErrors);
          toast.error("Please fix the highlighted fields.");

          // Field ids match the form field names.
          const firstField = Object.keys(validationErrors)[0];

          if (firstField) {
            document.getElementById(firstField)?.focus();
          }

          return;
        }

        const location = locations.find((item) => item.id === values.locationId);

        if (!location) {
          setErrors({ locationId: LOCATION_UNAVAILABLE_MESSAGE });
          setSubmitError(LOCATION_UNAVAILABLE_MESSAGE);
          toast.error(LOCATION_UNAVAILABLE_MESSAGE);
          return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        // Final TOCTOU re-verification of the location's active flag.
        let verified: { id: string; name: string } | null;

        try {
          verified = await verifyLocationActive(supabase, values.locationId);
        } catch (error) {
          console.error("[bookings] location verify failed", {
            stage: "verify_location",
            error,
          });

          const message = "We couldn't verify that location. Please try again.";

          if (isMounted()) setSubmitError(message);
          toast.error(message);
          return;
        }

        if (!verified) {
          setErrors({ locationId: LOCATION_UNAVAILABLE_MESSAGE });
          setSubmitError(LOCATION_UNAVAILABLE_MESSAGE);
          toast.error(LOCATION_UNAVAILABLE_MESSAGE);
          return;
        }

        const error = await insertBooking(
          supabase,
          buildBookingPayload(user, values),
        );

        if (error) {
          console.error("[bookings] insert failed", {
            stage: "submit_booking",
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });

          const friendlyMessage = mapSupabaseErrorToMessage(error);

          if (isMounted()) setSubmitError(friendlyMessage);
          toast.error(friendlyMessage);
          return;
        }

        if (!isMounted()) return;

        setConfirmedSnapshot({
          locationName: verified.name,
          date: values.date,
          time: values.time,
          email: values.email.trim(),
        });

        setErrors({});
        setSubmitError(null);
        setIsSubmitted(true);

        toast.success("Booking request sent!");
      } catch (error: unknown) {
        console.error("[bookings] unexpected submit error", {
          stage: "submit_booking",
          error,
        });

        const friendlyMessage = "A network error occurred. Please try again.";

        if (isMounted()) setSubmitError(friendlyMessage);
        toast.error(friendlyMessage);
      } finally {
        inFlightRef.current = false;

        if (isMounted()) setIsSubmitting(false);
      }
    },
    [
      isMounted,
      isUserLoaded,
      locations,
      locationsStatus,
      maxPartySize,
      onRequireSignin,
      setErrors,
      supabase,
      user,
      values,
    ],
  );

  return {
    handleSubmit,
    isSubmitting,
    isSubmitted,
    submitError,
    confirmedSnapshot,
    clearSubmitError,
    reset,
  };
}
