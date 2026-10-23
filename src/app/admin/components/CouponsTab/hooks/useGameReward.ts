import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import { useSupabaseClient } from "@/utils/supabase/client";

import { fetchGameReward, upsertGameReward } from "../api/gameReward";
import {
  REWARD_LOAD_ERROR,
  REWARD_SAVE_ERROR,
  REWARD_SUCCESS_TIMEOUT_MS,
} from "../constants";
import type { GameRewardConfig, GameRewardPatch } from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

export interface UseGameRewardResult {
  reward: GameRewardConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** `true` for a few seconds after a successful save. */
  justSaved: boolean;
  /** Edit the local (unsaved) copy. */
  edit: (patch: GameRewardPatch) => void;
  /** Save the local copy, optionally merged with `patch` (used by the AI). */
  save: (patch?: GameRewardPatch) => Promise<void>;
}

export function useGameReward(): UseGameRewardResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const [reward, setReward] = useState<GameRewardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const rewardRef = useLatestRef(reward);

  /** Guards a double click on Save, and an AI event during a manual save. */
  const savingRef = useRef(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const next = await fetchGameReward(supabase);

      if (!isMounted()) return;

      setReward(next);
      setError(null);
    } catch (loadError) {
      if (!isMounted()) return;

      console.error(
        "[CouponsTab] game reward fetch failed",
        { code: (loadError as { code?: string })?.code },
        loadError,
      );

      setError(REWARD_LOAD_ERROR);
      setReward(null);
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, [isMounted, supabase]);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel(`coupons_admin_rewards_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rewards" },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    };
  }, []);

  const edit = useCallback((patch: GameRewardPatch) => {
    setReward((previous) => (previous ? { ...previous, ...patch } : previous));
  }, []);

  const save = useCallback(
    async (patch?: GameRewardPatch): Promise<void> => {
      if (savingRef.current) return;

      const current = rewardRef.current;

      if (!current) {
        toast.error("The game reward isn't loaded yet. Please try again.");
        return;
      }

      const merged: GameRewardConfig = patch ? { ...current, ...patch } : current;

      savingRef.current = true;
      setSaving(true);
      setJustSaved(false);
      setError(null);

      try {
        await upsertGameReward(supabase, merged);

        if (!isMounted()) return;

        setReward(merged);
        setJustSaved(true);
        toast.success("Game reward saved.");

        if (successTimerRef.current !== null) {
          clearTimeout(successTimerRef.current);
        }

        successTimerRef.current = setTimeout(() => {
          successTimerRef.current = null;

          if (!isMounted()) return;

          setJustSaved(false);
        }, REWARD_SUCCESS_TIMEOUT_MS);
      } catch (saveError) {
        if (!isMounted()) return;

        console.error(
          "[CouponsTab] game reward save failed",
          { code: (saveError as { code?: string })?.code },
          saveError,
        );

        setError(REWARD_SAVE_ERROR);
        toast.error(REWARD_SAVE_ERROR);
      } finally {
        savingRef.current = false;

        if (isMounted()) setSaving(false);
      }
    },
    [isMounted, rewardRef, supabase],
  );

  return { reward, loading, saving, error, justSaved, edit, save };
}
