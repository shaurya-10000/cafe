import { useCallback, useEffect, useRef } from "react";

import { toast } from "sonner";

import { EVENTS, SECTION_ID } from "../constants";
import { prefillSignature, sanitizePrefillDetail } from "../lib/prefill";
import type {
  BookingFormData,
  BookingFormField,
  Location,
  LocationsStatus,
} from "../types";
import { useLatestRef } from "./useLatestRef";

/** Only an immediate duplicate of the same event is ignored; later re-sends apply. */
const DUPLICATE_WINDOW_MS = 1500;

interface UseBookingPrefillOptions {
  locations: readonly Location[];
  status: LocationsStatus;
  maxPartySize: number;
  isTouched: (field: BookingFormField) => boolean;
  applyPatch: (patch: Partial<BookingFormData>) => void;
}

/**
 * Applies `cafe_prefill_booking` events (from the AI concierge) to the form.
 *
 * Never overwrites a field the user has edited, and reconciles an incoming
 * `locationId` against the fetched list once it is ready, so a stale prefill
 * can't put the select into an invalid state.
 */
export function useBookingPrefill({
  locations,
  status,
  maxPartySize,
  isTouched,
  applyPatch,
}: UseBookingPrefillOptions): { resetSignature: () => void } {
  const lastSignatureRef = useRef("");
  const lastAppliedAtRef = useRef(0);

  const locationsRef = useLatestRef(locations);
  const statusRef = useLatestRef(status);
  const maxPartySizeRef = useLatestRef(maxPartySize);

  useEffect(() => {
    const handlePrefill = (event: Event): void => {
      const incoming = sanitizePrefillDetail(
        (event as CustomEvent<unknown>).detail,
        maxPartySizeRef.current,
      );

      if (Object.keys(incoming).length === 0) return;

      const applied: Partial<BookingFormData> = {};

      for (const [key, value] of Object.entries(incoming)) {
        const field = key as BookingFormField;

        if (typeof value === "string" && !isTouched(field)) {
          applied[field] = value;
        }
      }

      if (Object.keys(applied).length === 0) return;

      if (applied.locationId && statusRef.current === "ready") {
        const match = locationsRef.current.find(
          (location) => location.id === applied.locationId,
        );

        if (!match) delete applied.locationId;
      }

      if (Object.keys(applied).length === 0) return;

      const signature = prefillSignature(applied);

      // Ignore only an immediate duplicate (the same event delivered twice). The
      // same details sent again later must apply again, e.g. after the user
      // cleared the form.
      const now = Date.now();

      if (
        signature === lastSignatureRef.current &&
        now - lastAppliedAtRef.current < DUPLICATE_WINDOW_MS
      ) {
        return;
      }

      lastSignatureRef.current = signature;
      lastAppliedAtRef.current = now;

      applyPatch(applied);

      const section = document.getElementById(SECTION_ID);

      if (!section) return;

      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        toast.info("Booking details pre-filled from AI assistant.");
      }
    };

    window.addEventListener(EVENTS.PREFILL_BOOKING, handlePrefill);

    return () => {
      window.removeEventListener(EVENTS.PREFILL_BOOKING, handlePrefill);
    };
  }, [applyPatch, isTouched, locationsRef, maxPartySizeRef, statusRef]);

  const resetSignature = useCallback(() => {
    lastSignatureRef.current = "";
  }, []);

  return { resetSignature };
}
