import type { HTMLMotionProps } from "framer-motion";
import type { MouseEvent, RefObject } from "react";

export interface CartFABLabels {
  /** Accessible name of the button. Falls back to `visibleText`, then to a default. */
  buttonLabel?: string;

  /** Visible button text. Hidden from assistive technology. */
  visibleText?: string;

  /** Singular cart-item noun. */
  itemSingular?: string;

  /** Plural cart-item noun. */
  itemPlural?: string;

  /** Custom announcement when the cart count changes. */
  formatUpdateAnnouncement?: (count: number) => string;

  /** Custom announcement when the cart becomes empty. */
  formatEmptyAnnouncement?: () => string;

  /**
   * Formats the numeric badge. Defaults to `"99+"` for counts above 99.
   * Override for RTL numeral systems or locales that place the `+` first.
   */
  formatBadgeCount?: (count: number) => string;
}

export interface CartFABProps
  extends Omit<HTMLMotionProps<"button">, "onClick"> {
  /** Current number of cart items. */
  count: number;

  /** Called after the click guard accepts the interaction. */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;

  /** Render the FAB even when the normalized count is zero. */
  showWhenEmpty?: boolean;

  /** Localized/accessibility copy. */
  labels?: CartFABLabels;

  /** Overrides the default badge background styling. Pass `""` to remove it. */
  badgeClassName?: string;

  /**
   * Minimum interval between accepted clicks. Uses a monotonic clock.
   * Defaults to 300ms. Set to 0 to disable.
   */
  clickGuardMs?: number;

  /**
   * Element that should regain focus when the FAB disappears while it owns
   * keyboard focus. Should be focusable (native control, or `tabIndex={-1}`).
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export interface ResolvedLabels {
  buttonLabel: string;
  visibleText: string;
  itemSingular: string;
  itemPlural: string;
}

export interface AnnouncementFormatters {
  update: (count: number) => string;
  empty: () => string;
}