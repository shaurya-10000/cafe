import type { GameRewardPatch } from "../types";

interface RewardEventDetail {
  title?: unknown;
  promoCode?: unknown;
  discountValue?: unknown;
  description?: unknown;
  isActive?: unknown;
}

/**
 * Builds a partial patch from only the fields the AI actually sent. Any
 * field the AI omits keeps its current value: the AI is not required to
 * know the whole reward config to change one field.
 */
export function rewardPatchFromEvent(detail: RewardEventDetail): GameRewardPatch {
  const patch: GameRewardPatch = {};

  if (typeof detail.title === "string") patch.title = detail.title;
  if (typeof detail.promoCode === "string") patch.promo_code = detail.promoCode;

  if (typeof detail.discountValue === "string") {
    patch.discount_value = detail.discountValue;
  }

  if (typeof detail.description === "string") {
    patch.description = detail.description;
  }

  if (typeof detail.isActive === "boolean") patch.is_active = detail.isActive;

  return patch;
}
