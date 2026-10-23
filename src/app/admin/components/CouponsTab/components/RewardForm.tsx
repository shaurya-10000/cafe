import { memo } from "react";

import {
  AlertTriangle,
  Loader2,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { cx } from "../lib/cx";
import { REWARD_INPUT_CLASS, REWARD_LABEL_CLASS } from "../styles";
import type { GameRewardConfig, GameRewardPatch } from "../types";
import { Field } from "./Field";

interface RewardFormProps {
  reward: GameRewardConfig;
  error: string | null;
  saving: boolean;
  onChange: (patch: GameRewardPatch) => void;
  onSave: () => void;
}

export const RewardForm = memo(function RewardForm({
  reward,
  error,
  saving,
  onChange,
  onSave,
}: RewardFormProps) {
  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-[11px] font-bold text-red-500"
        >
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Reward Title" labelClassName={REWARD_LABEL_CLASS}>
          <input
            type="text"
            className={REWARD_INPUT_CLASS}
            value={reward.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="20% OFF YOUR BREW"
          />
        </Field>

        <Field label="Promo Code" labelClassName={REWARD_LABEL_CLASS}>
          <input
            type="text"
            className={cx(REWARD_INPUT_CLASS, "uppercase tracking-wider")}
            value={reward.promo_code}
            onChange={(event) =>
              onChange({ promo_code: event.target.value.toUpperCase() })
            }
            placeholder="CAFE20"
          />
        </Field>

        <Field label="Discount Value Tag" labelClassName={REWARD_LABEL_CLASS}>
          <input
            type="text"
            className={REWARD_INPUT_CLASS}
            value={reward.discount_value}
            onChange={(event) => onChange({ discount_value: event.target.value })}
            placeholder="20%"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
        <Field
          label="Description"
          labelClassName={REWARD_LABEL_CLASS}
          className="sm:col-span-2"
        >
          <input
            type="text"
            className={REWARD_INPUT_CLASS}
            value={reward.description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Welcome Scratch Card Reward"
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ is_active: !reward.is_active })}
            aria-pressed={reward.is_active}
            className={cx(
              "flex flex-1 items-center justify-between rounded-xl border p-2.5 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]",
              reward.is_active
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : "border-cafe-border bg-cafe-fg/5 text-gray-500",
            )}
          >
            <span>{reward.is_active ? "Game Active" : "Game Paused"}</span>

            {reward.is_active ? (
              <ToggleRight size={22} aria-hidden="true" />
            ) : (
              <ToggleLeft size={22} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            aria-busy={saving}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#C5A059] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#A67C00] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] focus-visible:ring-offset-2"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            ) : (
              <Save size={12} aria-hidden="true" />
            )}
            Save Game
          </button>
        </div>
      </div>

      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
        Changes here only affect new claims &mdash; customers who already
        scratched and won keep the terms they were shown at the time.
      </p>
    </div>
  );
});
