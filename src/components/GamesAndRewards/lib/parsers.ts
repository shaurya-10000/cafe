import type { ClaimedReward, GameRewardConfig } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDisplayString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Defensive parse of a `game_rewards_public` row. */
export function parseRewardConfig(value: unknown): GameRewardConfig | null {
  if (!isRecord(value)) return null;
  const { id, title, discount_value, requires_play } = value;
  if (typeof id !== "string" || typeof title !== "string") return null;

  return {
    id,
    title,
    discount_value: toDisplayString(discount_value),
    requires_play: requires_play === true,
  };
}

/** Defensive parse of a claimed reward (table row or RPC result). */
export function parseClaimedReward(value: unknown): ClaimedReward | null {
  if (!isRecord(value)) return null;
  const { title, promo_code, discount_value } = value;
  if (typeof title !== "string" || typeof promo_code !== "string") return null;

  return {
    title,
    promo_code,
    discount_value: toDisplayString(discount_value),
  };
}
