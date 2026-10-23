export const LOCATION_TIMEOUT_MS = 8_000;
export const LOCATION_MAX_AGE_MS = 300_000;
export const COPY_FEEDBACK_MS = 2_000;
export const SWIPE_THRESHOLD_PX = 60;
export const MAP_ZOOM = 15;

/** Window event other parts of the app (e.g. the AI concierge) dispatch to
 *  switch the active location: detail = { locationId: string }. */
export const SELECT_LOCATION_EVENT = "cafe_select_location";

/**
 * Postgres 42501 = role-level "permission denied for table", raised when the
 * table grant itself rejects the query, as opposed to RLS filtering rows out.
 * Part C of the migration set grants `anon` SELECT on business_locations, so
 * this is defense-in-depth in case that grant is ever revoked.
 */
export const POSTGRES_INSUFFICIENT_PRIVILEGE = "42501";

export const GOOGLE_MAPS_DIRECTIONS_BASE =
  "https://www.google.com/maps/dir/?api=1&destination=";
export const GOOGLE_MAPS_EMBED_BASE = "https://www.google.com/maps?q=";

/**
 * RLS (`locations_select_public`) already restricts this to active rows for
 * non-admins, so no `.eq("is_active", true)` filter is needed client-side.
 */
export const SUPABASE_LOCATION_SELECT = `
  id,
  name,
  address,
  latitude,
  longitude,
  phone,
  timezone,
  hours_weekday,
  hours_weekend,
  image_url,
  max_capacity,
  default_booking_duration_minutes,
  display_order
`;
