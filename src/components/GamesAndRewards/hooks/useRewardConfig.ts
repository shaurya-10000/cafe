import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
import { fetchRewardConfig } from "../api/rewardsApi";
import { REWARD_KEY } from "../constants";
import type { GameRewardConfig } from "../types";

interface RewardConfigState {
  config: GameRewardConfig | null;
  loading: boolean;
}

/** Loads the admin-configured reward. Only signed-in users need it. */
export function useRewardConfig(enabled: boolean): RewardConfigState {
  const supabase = useSupabaseClient();
  // `null` until the first load settles (success or failure).
  const [result, setResult] = useState<{
    config: GameRewardConfig | null;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    fetchRewardConfig(supabase, REWARD_KEY)
      .then((config) => {
        if (!cancelled) setResult({ config });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[GamesAndRewards] reward config load failed", error);
        setResult((previous) => previous ?? { config: null });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, supabase]);

  return useMemo<RewardConfigState>(
    () =>
      enabled
        ? { config: result?.config ?? null, loading: result === null }
        : { config: null, loading: false },
    [enabled, result],
  );
}