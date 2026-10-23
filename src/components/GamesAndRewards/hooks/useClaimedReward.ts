import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
import { claimGameReward, fetchClaimedReward } from "../api/rewardsApi";
import { REWARD_KEY } from "../constants";
import type { ClaimOutcome, ClaimedReward, GameRewardConfig } from "../types";
import { useIsMounted } from "./useIsMounted";

interface Options {
  /** Null for guests: nothing to look up or claim. */
  readonly userId: string | null;
  readonly rewardConfig: GameRewardConfig | null;
}

/** Existing-claim lookup plus the claim action. */
export function useClaimedReward({ userId, rewardConfig }: Options) {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  // Client-side double-click guard only; the RPC is idempotent server-side.
  const hasClaimedRef = useRef(false);

  const [claimedReward, setClaimedReward] = useState<ClaimedReward | null>(null);
  const [claimChecked, setClaimChecked] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  /* ---- Has this user already claimed? ---------------------------------- */

  useEffect(() => {
    if (!userId) {
      hasClaimedRef.current = false;
      setClaimedReward(null);
      setClaimChecked(true);
      return;
    }

    let cancelled = false;
    setClaimChecked(false);

    fetchClaimedReward(supabase, userId, REWARD_KEY)
      .then((reward) => {
        if (cancelled) return;
        hasClaimedRef.current = reward !== null;
        setClaimedReward(reward);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[GamesAndRewards] existing claim check failed", error);
        hasClaimedRef.current = false;
        setClaimedReward(null);
      })
      .finally(() => {
        if (!cancelled) setClaimChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  /* ---- Claim ------------------------------------------------------------ */

  const claim = useCallback(async (): Promise<ClaimOutcome> => {
    if (hasClaimedRef.current || !userId || !rewardConfig) return "ignored";
    if (rewardConfig.requires_play) return "ignored";

    hasClaimedRef.current = true;
    setIsClaiming(true);

    try {
      const reward = await claimGameReward(supabase, rewardConfig.id);
      if (!isMounted()) return "ignored";

      if (!reward) {
        // Nothing usable came back, so nothing is known to be recorded:
        // allow a retry (the RPC is idempotent).
        hasClaimedRef.current = false;
        return "failed";
      }

      setClaimedReward(reward);
      return "claimed";
    } catch (error) {
      console.error("[GamesAndRewards] claim failed", error);
      hasClaimedRef.current = false; // nothing was recorded: allow retry
      return isMounted() ? "failed" : "ignored";
    } finally {
      if (isMounted()) setIsClaiming(false);
    }
  }, [userId, rewardConfig, supabase, isMounted]);

  return { claimedReward, claimChecked, isClaiming, claim };
}
