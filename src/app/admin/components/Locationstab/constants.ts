export const IANA_TIMEZONE_SUGGESTIONS = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Australia/Sydney",
  "UTC",
] as const;

// Mirrors LocationActions.ts's server-side limits: checked here too so a
// bad file is rejected instantly instead of round-tripping to the server
// action first.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Delay before the AI-driven listener fires, in milliseconds. The chat
 * widget routes to /admin?tab=branches first; this tab needs to have
 * mounted and been populated with `initialLocations` before the handler
 * can find the target location by id. 400ms is enough on a warm client;
 * on a cold one the `find` misses and surfaces a clear toast instead of
 * silently doing nothing.
 */
export const AI_ACTION_SETTLE_MS = 400;

export const FORM_DEFAULTS = {
  timezone: "UTC",
  hoursWeekday: "Mon-Fri: 9am - 6pm",
  hoursWeekend: "Sat-Sun: 10am - 4pm",
  maxCapacity: 20,
  defaultBookingDurationMinutes: 60,
} as const;

export const BUSY_MESSAGE = "Another change is in progress. Please try again in a moment.";
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
