/**
 * Matches the row seeded in `supabase.sql`
 * (`INSERT INTO game_rewards ... reward_key = 'welcome_reward',
 * promo_code = 'WELCOME10'`). Any other key here would create a second,
 * orphaned `game_rewards` row instead of reading and editing the real one.
 */
export const REWARD_KEY = "welcome_reward";

/** Window event the AI concierge dispatches to bring the rewards into view. */
export const OPEN_REWARD_EVENT = "cafe_open_reward";

/** The section's anchor id. Same as `home/page.tsx`, so it must stay static. */
export const REWARD_SECTION_ID = "games-rewards";

export const COPY_FEEDBACK_MS = 2_000;

export const MESSAGES = {
  claimSuccess: "Your coupon has been claimed.",
  claimFailed: "Couldn't claim your coupon \u2014 please try again.",
  copyDenied: "Couldn't copy automatically \u2014 the code is on screen.",
  copyUnsupported: "Clipboard isn't available in this browser.",
} as const;
