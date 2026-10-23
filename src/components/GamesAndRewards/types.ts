import type { useSupabaseClient } from "@/utils/supabase/client";

export type SupabaseClient = ReturnType<typeof useSupabaseClient>;

export interface GamesAndRewardsProps {
  isAuthenticated?: boolean;
  onSignUpClick?: () => void;
}

/**
 * Public, pre-claim view of a reward (`game_rewards_public`).
 *
 * The view lists ACTIVE rewards only and never exposes `promo_code`: the code
 * is revealed exclusively by `claim_game_reward()`. So a missing row means the
 * reward is inactive or not seeded, and `requires_play` rewards cannot be
 * claimed from this component (the server records the winning play).
 */
export interface GameRewardConfig {
  id: string;
  title: string;
  discount_value: string;
  requires_play: boolean;
}

export interface ClaimedReward {
  title: string;
  promo_code: string;
  discount_value: string;
}

/** "ignored" = nothing happened (guard hit, unmounted, or not claimable). */
export type ClaimOutcome = "claimed" | "failed" | "ignored";

export type CopyResult = "copied" | "denied" | "unsupported";
