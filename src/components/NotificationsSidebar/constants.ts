/** Most notifications the sidebar ever holds or fetches. */
export const MAX_NOTIFICATIONS = 10;

/**
 * Applied when comparing an incoming notification's `created_at` against the
 * list we already have, so a push that lands a few ms before we see the same
 * row via realtime doesn't create a duplicate in the sidebar.
 */
export const NOTIFICATION_DEDUPE_WINDOW_MS = 2_000;

export const DELETE_ERROR_MESSAGE =
  "Couldn't delete that notification. Try again.";
