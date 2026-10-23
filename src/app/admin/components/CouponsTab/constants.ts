import type { GameRewardConfig } from "./types";

// Matches the row actually seeded in supabase.sql (see GamesAndRewards.tsx
// for the same constant on the customer-facing side). Using any other key
// here creates a second, orphaned game_rewards row instead of editing the
// real one.
export const REWARD_KEY = "welcome_reward";

/**
 * Delay before the AI-driven listener fires, in milliseconds. The chat
 * widget routes to /admin?tab=coupons first, and this tab needs to be
 * mounted and populated before the handler can find the target coupon by id
 * or merge against the current game reward config. 400ms is enough on a
 * warm client; on a cold one the lookup misses and surfaces a clear toast
 * instead of silently doing nothing.
 */
export const AI_ACTION_SETTLE_MS = 400;

/** Auto-dismiss timer for the "Saved Successfully" pill. */
export const REWARD_SUCCESS_TIMEOUT_MS = 3_000;

/**
 * Currency symbol used across the coupon UI. The tab does not receive the
 * business currency yet; thread it through here when it does.
 */
export const CURRENCY_SYMBOL = "$";

export const REWARD_LOAD_ERROR = "Couldn't load the game reward configuration.";
export const REWARD_SAVE_ERROR = "Couldn't save the game reward. Please try again.";

/**
 * Mirrors the actual seed values from supabase.sql rather than made-up
 * placeholders, so a Save with a missing row recreates the same row instead
 * of a differently-named one.
 */
export const DEFAULT_GAME_REWARD: Readonly<GameRewardConfig> = Object.freeze({
  id: "",
  reward_key: REWARD_KEY,
  title: "Welcome Reward",
  promo_code: "WELCOME10",
  discount_value: "10%",
  description:
    "Welcome reward for new customers \u2014 edit or remove in admin settings.",
  is_active: true,
});
