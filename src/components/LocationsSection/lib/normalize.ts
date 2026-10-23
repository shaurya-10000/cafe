import type { BusinessLocation } from "../types";
import { isValidLatitude, isValidLongitude } from "./geo";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidLocation(value: unknown): value is BusinessLocation {
  if (!value || typeof value !== "object") return false;
  const loc = value as Partial<Record<keyof BusinessLocation, unknown>>;

  return (
    isNonEmptyString(loc.id) &&
    isNonEmptyString(loc.name) &&
    isNonEmptyString(loc.address) &&
    isValidLatitude(loc.latitude) &&
    isValidLongitude(loc.longitude) &&
    (loc.phone === null || typeof loc.phone === "string") &&
    isNonEmptyString(loc.timezone) &&
    typeof loc.hoursWeekday === "string" &&
    typeof loc.hoursWeekend === "string" &&
    (loc.imageUrl === null || typeof loc.imageUrl === "string") &&
    isFiniteNumber(loc.maxCapacity) &&
    isFiniteNumber(loc.defaultBookingDurationMinutes) &&
    isFiniteNumber(loc.displayOrder)
  );
}

/**
 * Maps one raw Supabase row (snake_case) into a BusinessLocation, or null if
 * the required fields don't validate.
 */
export function normalizeLocationRow(row: unknown): BusinessLocation | null {
  if (!row || typeof row !== "object") return null;
  const raw = row as Record<string, unknown>;

  const candidate: unknown = {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    latitude: raw.latitude,
    longitude: raw.longitude,
    phone: raw.phone ?? null,
    timezone: raw.timezone,
    hoursWeekday: raw.hours_weekday ?? "",
    hoursWeekend: raw.hours_weekend ?? "",
    imageUrl: raw.image_url ?? null,
    maxCapacity: raw.max_capacity,
    defaultBookingDurationMinutes: raw.default_booking_duration_minutes,
    displayOrder: raw.display_order,
  };

  return isValidLocation(candidate) ? candidate : null;
}

/**
 * Validates and maps a full raw Supabase response array, dropping anything
 * malformed rather than throwing.
 */
export function normalizeLocationRows(input: unknown): BusinessLocation[] {
  if (!Array.isArray(input)) return [];
  const result: BusinessLocation[] = [];
  for (const row of input) {
    const location = normalizeLocationRow(row);
    if (location) result.push(location);
  }
  return result;
}
