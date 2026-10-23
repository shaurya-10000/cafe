import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { DEFAULT_BOOKING_FORM_DATA } from "../constants";
import { validateBookingForm } from "../lib/validation";
import type {
  BookingFormData,
  BookingFormField,
  FieldBlurHandler,
  FieldChangeHandler,
  FormErrors,
} from "../types";
import { useLatestRef } from "./useLatestRef";

interface UseBookingFormOptions {
  /** Signed-in user's email; prefilled until the user types their own. */
  sessionEmail: string | undefined;
  maxPartySize: number;
  /** Selected automatically while no location is chosen. */
  defaultLocationId: string | undefined;
}

export interface UseBookingFormResult {
  values: BookingFormData;
  errors: FormErrors;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  clearErrors: () => void;
  handleChange: FieldChangeHandler;
  handleBlur: FieldBlurHandler;
  /** `true` once the user has edited the field themselves. */
  isTouched: (field: BookingFormField) => boolean;
  /** Merges externally supplied values (e.g. from the AI concierge). */
  applyPatch: (patch: Partial<BookingFormData>) => void;
}

export function useBookingForm({
  sessionEmail,
  maxPartySize,
  defaultLocationId,
}: UseBookingFormOptions): UseBookingFormResult {
  const [values, setValues] = useState<BookingFormData>(() =>
    defaultLocationId
      ? { ...DEFAULT_BOOKING_FORM_DATA, locationId: defaultLocationId }
      : DEFAULT_BOOKING_FORM_DATA,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const touchedRef = useRef<Set<BookingFormField>>(new Set());
  const valuesRef = useLatestRef(values);

  // Prefer the session email unless the user has already typed something.
  // A signed-in user gets a correct address by default, but can still book
  // for someone else (e.g. a gift) by editing the field.
  useEffect(() => {
    if (!sessionEmail) return;

    setValues((previous) => {
      if (previous.email.trim() || touchedRef.current.has("email")) {
        return previous;
      }

      return { ...previous, email: sessionEmail };
    });
  }, [sessionEmail]);

  // Select the default location once one becomes available, unless the user
  // already picked one. Adjusted during render, guarded by the previous value.
  const [previousDefaultLocationId, setPreviousDefaultLocationId] =
    useState(defaultLocationId);
  if (previousDefaultLocationId !== defaultLocationId) {
    setPreviousDefaultLocationId(defaultLocationId);

    if (defaultLocationId) {
      setValues((previous) =>
        previous.locationId
          ? previous
          : { ...previous, locationId: defaultLocationId },
      );
    }
  }

  const handleChange = useCallback<FieldChangeHandler>((event) => {
    const { name, value } = event.target;
    const field = name as BookingFormField;

    if (!(field in DEFAULT_BOOKING_FORM_DATA)) return;

    touchedRef.current.add(field);

    // Party size is digits-only, always.
    const sanitized =
      field === "partySize" ? value.replace(/[^\d]/g, "").slice(0, 3) : value;

    setValues((previous) => ({ ...previous, [field]: sanitized }));

    setErrors((previous) => {
      if (!previous[field]) return previous;

      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const handleBlur = useCallback<FieldBlurHandler>(
    (event) => {
      const field = event.target.name as BookingFormField;

      if (!(field in DEFAULT_BOOKING_FORM_DATA)) return;

      // Validate only this field, so unrelated errors don't surface while
      // the user is still filling the form.
      const fieldErrors = validateBookingForm(
        valuesRef.current,
        new Date(),
        maxPartySize,
      );

      setErrors((previous) => {
        const next = { ...previous };

        if (fieldErrors[field]) {
          next[field] = fieldErrors[field];
        } else {
          delete next[field];
        }

        return next;
      });
    },
    [maxPartySize, valuesRef],
  );

  const isTouched = useCallback(
    (field: BookingFormField) => touchedRef.current.has(field),
    [],
  );

  const applyPatch = useCallback((patch: Partial<BookingFormData>) => {
    setValues((previous) => ({ ...previous, ...patch }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    setErrors,
    clearErrors,
    handleChange,
    handleBlur,
    isTouched,
    applyPatch,
  };
}
