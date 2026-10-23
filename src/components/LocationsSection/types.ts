/**
 * Mirrors public.business_locations. No slug, structured per-day hours or
 * exceptions table exist in the schema; hours are the two free-text columns
 * (hours_weekday / hours_weekend) exactly as stored.
 */
export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  /** IANA timezone, e.g. "Asia/Kolkata". Informational only: with no
   *  structured hours there is nothing to compute open/closed status from. */
  timezone: string;
  hoursWeekday: string;
  hoursWeekend: string;
  imageUrl: string | null;
  maxCapacity: number;
  defaultBookingDurationMinutes: number;
  displayOrder: number;
}

export type NearestLookupStatus =
  | "idle"
  | "locating"
  | "success"
  | "unavailable";

export type LoadErrorKind = "permission" | "network";

export type MapStatus = "idle" | "loading" | "loaded";

export type SlideDirection = "prev" | "next";

/** ARIA attributes linking the visible panel to its active tab. */
export interface TabPanelAttributes {
  id: string;
  labelledBy: string;
}
