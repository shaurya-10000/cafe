import { DEFAULT_LABELS } from "../constants";
import type { CartFABLabels, ResolvedLabels } from "../types";

export function resolveLabels(labels?: CartFABLabels): ResolvedLabels {
  return {
    buttonLabel: labels?.buttonLabel ?? DEFAULT_LABELS.buttonLabel,
    visibleText: labels?.visibleText ?? DEFAULT_LABELS.visibleText,
    itemSingular: labels?.itemSingular ?? DEFAULT_LABELS.itemSingular,
    itemPlural: labels?.itemPlural ?? DEFAULT_LABELS.itemPlural,
  };
}

/**
 * Accessible name precedence:
 *   1. explicit `aria-label` prop
 *   2. `labels.buttonLabel`
 *   3. `labels.visibleText` (so SR text matches the screen for locales that
 *      only overrode the visible string)
 *   4. English default
 */
export function resolveAccessibleLabel(
  ariaLabel: string | undefined,
  labels: CartFABLabels | undefined,
): string {
  const explicit = ariaLabel?.trim();
  if (explicit) return explicit;

  const explicitButton = labels?.buttonLabel?.trim();
  if (explicitButton) return explicitButton;

  const explicitVisible = labels?.visibleText?.trim();
  if (explicitVisible) return explicitVisible;

  return DEFAULT_LABELS.buttonLabel;
}