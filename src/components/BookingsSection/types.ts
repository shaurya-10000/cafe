import type { ChangeEvent, FocusEvent } from "react";

import type { useSupabaseClient } from "@/utils/supabase/client";

export interface Location {
  id: string;
  name: string;
}

export interface BookingFormData {
  date: string;
  time: string;
  partySize: string;
  email: string;
  locationId: string;
  specialRequests: string;
}

export type BookingFormField = keyof BookingFormData;

export type FormErrors = Partial<Record<BookingFormField, string>>;

/**
 * Subset of PostgREST's error shape we actually consume. `code` is a
 * Postgres SQLSTATE; `message` is the human-readable text Postgres puts in
 * `raise exception '...'` (SQLSTATE P0001) plus your custom messages on
 * errcode='23514'.
 */
export interface SupabaseLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * @deprecated Legacy shape accepted by `sanitizePrefillDetail` for backwards
 * compatibility with upstream producers. Prefer the canonical keys
 * (`partySize`, `locationId`, `specialRequests`); the aliases below are kept
 * only during the migration window and will be removed in the next major.
 */
export interface PrefillDetail {
  date?: string;
  time?: string;
  partySize?: string | number;
  locationId?: string;
  specialRequests?: string;
  guests?: string | number;
  branchId?: string;
  notes?: string;
}

export type LocationsStatus = "loading" | "error" | "empty" | "ready";

export interface ConfirmedSnapshot {
  locationName: string;
  date: string;
  time: string;
  email: string;
}

export interface BusinessSettings {
  maxPartySize: number;
  businessName: string | null;
}

export type SupabaseClientLike = ReturnType<typeof useSupabaseClient>;

/** The slice of the Clerk user the booking flow needs. */
export interface BookingUser {
  id: string;
  fullName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
}

export interface BookingInsertPayload {
  user_id: string;
  user_name: string;
  user_email: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  location_id: string;
  special_requests: string | null;
}

export type FieldElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

export type FieldChangeHandler = (event: ChangeEvent<FieldElement>) => void;
export type FieldBlurHandler = (event: FocusEvent<FieldElement>) => void;
