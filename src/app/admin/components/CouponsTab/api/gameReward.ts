import { DEFAULT_GAME_REWARD, REWARD_KEY } from "../constants";
import type { GameRewardConfig, SupabaseClientLike } from "../types";

/** Loads the reward row; a missing row yields the seed defaults. Throws on error. */
export async function fetchGameReward(
  supabase: SupabaseClientLike,
): Promise<GameRewardConfig> {
  const { data, error } = await supabase
    .from("game_rewards")
    .select("*")
    .eq("reward_key", REWARD_KEY)
    .maybeSingle();

  if (error) throw error;

  return (data as GameRewardConfig | null) ?? { ...DEFAULT_GAME_REWARD };
}

/** Upserts the reward row by `reward_key`. Throws on error. */
export async function upsertGameReward(
  supabase: SupabaseClientLike,
  reward: GameRewardConfig,
): Promise<void> {
  const { error } = await supabase.from("game_rewards").upsert(
    {
      reward_key: REWARD_KEY,
      title: reward.title,
      promo_code: reward.promo_code.toUpperCase(),
      discount_value: reward.discount_value,
      description: reward.description,
      is_active: reward.is_active,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "reward_key" },
  );

  if (error) throw error;
}
