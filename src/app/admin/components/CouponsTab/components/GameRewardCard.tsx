import { memo } from "react";

import { AlertTriangle, Gamepad2, Loader2, Sparkles } from "lucide-react";

import type { UseGameRewardResult } from "../hooks/useGameReward";
import { RewardForm } from "./RewardForm";

interface GameRewardCardProps {
  state: UseGameRewardResult;
}

export const GameRewardCard = memo(function GameRewardCard({
  state,
}: GameRewardCardProps) {
  const { reward, loading, saving, error, justSaved, edit, save } = state;

  return (
    <div className="space-y-5 rounded-3xl border border-cafe-border bg-cafe-card p-6 text-cafe-fg shadow-xl">
      <div className="flex items-center justify-between border-b border-cafe-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C5A059]/20">
            <Gamepad2 className="text-[#C5A059]" size={20} aria-hidden="true" />
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-cafe-fg">
              Games &amp; Rewards Configuration
              <Sparkles size={14} className="text-[#C5A059]" aria-hidden="true" />
            </h3>

            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Manage the live reward for the Customer Welcome Scratch Card game
            </p>
          </div>
        </div>

        {justSaved && (
          <span
            role="status"
            className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400"
          >
            Saved Successfully
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2
            size={20}
            className="animate-spin text-[#C5A059]"
            aria-hidden="true"
          />

          <span className="sr-only">Loading game reward&hellip;</span>
        </div>
      ) : reward ? (
        <RewardForm
          reward={reward}
          error={error}
          saving={saving}
          onChange={edit}
          onSave={() => void save()}
        />
      ) : error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-[11px] font-bold text-red-500"
        >
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </div>
      ) : null}
    </div>
  );
});
