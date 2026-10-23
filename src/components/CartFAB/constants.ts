import type { ResolvedLabels } from "./types";

export const ANNOUNCEMENT_DELAY_MS = 150;
export const DEFAULT_CLICK_GUARD_MS = 300;
export const MAX_DISPLAY_COUNT = 99;

export const DEFAULT_EMPTY_ANNOUNCEMENT = "Cart is now empty.";

export const DEFAULT_LABELS: ResolvedLabels = {
  buttonLabel: "View order",
  visibleText: "View Order",
  itemSingular: "item",
  itemPlural: "items",
};

export const INSTANT_TRANSITION = { duration: 0 } as const;

export const BUTTON_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.8,
} as const;

export const BADGE_SPRING = {
  type: "spring",
  stiffness: 500,
  damping: 25,
  mass: 0.6,
} as const;

export const VISIBLE_STATE = { opacity: 1, scale: 1, y: 0 } as const;
export const HIDDEN_STATE = { opacity: 0, scale: 0.8, y: 20 } as const;
export const HIDDEN_STATE_REDUCED = { opacity: 0 } as const;

export const HOVER_STATE = { scale: 1.05 } as const;
export const TAP_STATE = { scale: 0.95 } as const;