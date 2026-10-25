export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const MAX_REMARK_LENGTH = 2_000;

/**
 * How long the success panel stays visible before the modal closes itself.
 * Long enough to read the confirmation, short enough not to feel like waiting.
 */
export const SUCCESS_AUTO_CLOSE_MS = 1_600;

export const STAR_VALUES = [1, 2, 3, 4, 5] as const;
export const DEFAULT_RATING = 5;
export const STAR_FILL_COLOR = "var(--accent)";

/** Postgres unique_violation. */
export const UNIQUE_VIOLATION_CODE = "23505";

export const ALREADY_REVIEWED_MESSAGE =
  "One or more of these items were already reviewed.";

export const NOT_RATABLE_REASONS = {
  cancelled: "This order was cancelled and can't be reviewed.",
  notCompleted: "You can rate this order once it's completed.",
  noItems: "This order has no items to rate.",
  itemsUnavailable: "The items in this order are no longer available to rate.",
} as const;

export const BACKDROP_FADE_S = 0.2;

export const DIALOG_SPRING = {
  type: "spring",
  damping: 26,
  stiffness: 300,
} as const;

export const DIALOG_HIDDEN = { opacity: 0, scale: 0.95, y: 20 } as const;
export const DIALOG_HIDDEN_REDUCED = { opacity: 0 } as const;
export const DIALOG_VISIBLE = { opacity: 1, scale: 1, y: 0 } as const;