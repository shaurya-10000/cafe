import { parseClaimedReward, parseRewardConfig } from "../lib/parsers";
import type {
  ClaimedReward,
  GameRewardConfig,
  SupabaseClient,
} from "../types";

/** The active reward config, or null if inactive/not seeded. Throws on error. */
export async function fetchRewardConfig(
  supabase: SupabaseClient,
  rewardKey: string,
): Promise<GameRewardConfig | null> {
  const { data, error } = await supabase
    .from("game_rewards_public")
    .select("id, title, discount_value, requires_play")
    .eq("reward_key", rewardKey)
    .maybeSingle();

  if (error) throw error;
  return parseRewardConfig(data);
}

/**
 * Looked up by `reward_key`, not by the live config's id: a user who already
 * claimed must keep seeing their code even if an admin later deactivates the
 * reward (which removes it from `game_rewards_public`).
 */
export async function fetchClaimedReward(
  supabase: SupabaseClient,
  userId: string,
  rewardKey: string,
): Promise<ClaimedReward | null> {
  const { data, error } = await supabase
    .from("user_claimed_rewards")
    .select("title, promo_code, discount_value")
    .eq("user_id", userId)
    .eq("reward_key", rewardKey)
    .maybeSingle();

  if (error) throw error;
  return parseClaimedReward(data);
}

/**
 * `claim_game_reward` is SECURITY DEFINER: it derives the caller's identity
 * server-side via `requesting_user_id()` rather than trusting a client-supplied
 * user id, row-locks the reward (`for share`), and inserts idempotently
 * (`on conflict (user_id, reward_id) do nothing`, then re-selects the existing
 * row if the insert no-opped). So this call is safe to retry and safe under
 * any race the client-side guard misses: the database is the real guarantee.
 */
export async function claimGameReward(
  supabase: SupabaseClient,
  rewardId: string,
): Promise<ClaimedReward | null> {
  const { data, error } = await supabase.rpc("claim_game_reward", {
    p_reward_id: rewardId,
  });

  if (error) throw error;
  return parseClaimedReward(data);
}
