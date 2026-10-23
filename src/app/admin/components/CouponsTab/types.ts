import type { useSupabaseClient } from "@/utils/supabase/client";

export type SupabaseClientLike = ReturnType<typeof useSupabaseClient>;

export interface GameRewardConfig {
  id: string;
  reward_key: string;
  title: string;
  promo_code: string;
  discount_value: string;
  description: string;
  is_active: boolean;
}

export type GameRewardPatch = Partial<GameRewardConfig>;

export type CouponVariant = "active" | "inactive";
