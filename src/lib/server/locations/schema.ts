import { z } from "zod";

import { FORM_DEFAULTS } from "./constants";
import { getOptionalString, parseCheckbox } from "./formData";

// Mirrors public.business_locations exactly: no slug, no per-day weekly
// hours table, no exceptions table, no archived_at, no audit-log table.
// `is_active` is the only lifecycle flag.

export const UUID_SCHEMA = z.string().uuid();

function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const LocationInputSchema = z.object({
  id: UUID_SCHEMA.optional(),
  // business_locations.name: check (char_length(btrim(name)) between 1 and 120)
  name: z.string().trim().min(1, "Name is required.").max(120),
  // business_locations.address: check (char_length(btrim(address)) between 1 and 500)
  address: z.string().trim().min(1, "Address is required.").max(500),
  // business_locations.latitude: check (latitude between -90 and 90)
  latitude: z.coerce.number().finite().min(-90).max(90),
  // business_locations.longitude: check (longitude between -180 and 180)
  longitude: z.coerce.number().finite().min(-180).max(180),
  phone: z.string().trim().max(40).optional(),
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(
      isValidIanaTimezone,
      "Enter a valid IANA timezone (e.g. Asia/Kolkata).",
    ),
  hoursWeekday: z
    .string()
    .trim()
    .min(1, "Weekday hours are required.")
    .max(200),
  hoursWeekend: z
    .string()
    .trim()
    .min(1, "Weekend hours are required.")
    .max(200),
  imageUrl: z.string().url().max(2048).optional(),
  // business_locations.max_capacity: check (max_capacity > 0)
  maxCapacity: z.coerce.number().int().min(1).max(100_000),
  // business_locations.default_booking_duration_minutes: check (> 0).
  // Capped at 1440 (24h) as a sane business rule; the DB itself allows more.
  defaultBookingDurationMinutes: z.coerce.number().int().min(1).max(1440),
  isActive: z.boolean(),
});

export type LocationInput = z.infer<typeof LocationInputSchema>;

/** FormData is never trusted as typed: everything goes through the schema. */
export function parseLocationForm(formData: FormData) {
  return LocationInputSchema.safeParse({
    id: getOptionalString(formData, "id"),
    name: getOptionalString(formData, "name"),
    address: getOptionalString(formData, "address"),
    latitude: getOptionalString(formData, "latitude"),
    longitude: getOptionalString(formData, "longitude"),
    phone: getOptionalString(formData, "phone"),
    timezone: getOptionalString(formData, "timezone") ?? FORM_DEFAULTS.timezone,
    hoursWeekday:
      getOptionalString(formData, "hoursWeekday") ?? FORM_DEFAULTS.hoursWeekday,
    hoursWeekend:
      getOptionalString(formData, "hoursWeekend") ?? FORM_DEFAULTS.hoursWeekend,
    imageUrl: getOptionalString(formData, "imageUrl"),
    maxCapacity:
      getOptionalString(formData, "maxCapacity") ?? FORM_DEFAULTS.maxCapacity,
    defaultBookingDurationMinutes:
      getOptionalString(formData, "defaultBookingDurationMinutes") ??
      FORM_DEFAULTS.defaultBookingDurationMinutes,
    isActive: parseCheckbox(formData, "isActive"),
  });
}

/** Row shape written to business_locations (without display_order). */
export function toLocationRow(data: LocationInput) {
  return {
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    phone: data.phone ?? null,
    timezone: data.timezone,
    hours_weekday: data.hoursWeekday,
    hours_weekend: data.hoursWeekend,
    image_url: data.imageUrl ?? null,
    max_capacity: data.maxCapacity,
    default_booking_duration_minutes: data.defaultBookingDurationMinutes,
    is_active: data.isActive,
  };
}
