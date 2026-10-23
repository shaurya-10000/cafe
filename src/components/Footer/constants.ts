export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const DEFAULT_NEWSLETTER_ENDPOINT = "/api/newsletter";

/** setTimeout stores its delay in a signed 32-bit int; larger values fire at once. */
export const MAX_TIMER_DELAY_MS = 2_147_483_647;

export const MAX_SERVER_MESSAGE_LENGTH = 200;

/**
 * Newsletter submissions are short-lived round-trips; a hung request with no
 * timeout would leave the button stuck in its submitting state forever.
 */
export const NEWSLETTER_FETCH_TIMEOUT_MS = 15_000;
