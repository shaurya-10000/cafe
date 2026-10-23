"use client";

import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { ShoppingBag } from "lucide-react";

import { CartBadge, LiveRegion } from "./components";
import { DEFAULT_CLICK_GUARD_MS } from "./constants";
import {
  useCartAnnouncement,
  useCartFABMotion,
  useClickGuard,
  useFocusRestore,
} from "./hooks";
import {
  formatBadgeCount,
  mergeRefs,
  normalizeCount,
  resolveAccessibleLabel,
  resolveAnnouncementFormatters,
  resolveLabels,
} from "./lib";
import {
  ICON_CLASS,
  ICON_WRAPPER_CLASS,
  VISIBLE_TEXT_CLASS,
  buildBadgeClassName,
  buildButtonClassName,
} from "./styles";
import type { CartFABProps } from "./types";

/**
 * CartFAB
 *
 * Floating cart/order action.
 *
 * - Defensive count normalization (NaN / negative / Infinity → 0, floored,
 *   >99 shown as "99+").
 * - Stable accessible name across count changes; debounced polite
 *   announcements keyed off the last *announced* value.
 * - Full reduced-motion support.
 * - Monotonic-clock click de-duplication.
 * - Focus restoration after exit, only if the FAB owned focus.
 * - Localized labels, RTL positioning, mobile safe-area insets.
 *
 * Peer deps: `react` 18+, `framer-motion` 11+, `lucide-react`, Tailwind.
 * The default badge background assumes a `cafe-accent` theme token; pass
 * `badgeClassName` otherwise.
 *
 * Caller-supplied `onFocus` / `onBlur` are composed with the internal focus
 * tracking rather than replacing it.
 */
const CartFAB = forwardRef<HTMLButtonElement, CartFABProps>(function CartFAB(
  {
    count,
    onClick,
    showWhenEmpty = false,
    labels,
    badgeClassName,
    clickGuardMs = DEFAULT_CLICK_GUARD_MS,
    returnFocusRef,
    className,
    "aria-label": ariaLabel,
    disabled = false,
    onFocus,
    onBlur,
    ...buttonProps
  },
  forwardedRef,
) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const mergedRef = useMemo(
    () => mergeRefs(buttonRef, forwardedRef),
    [forwardedRef],
  );

  const safeCount = normalizeCount(count);
  const shouldRender = showWhenEmpty || safeCount > 0;

  const resolvedLabels = useMemo(() => resolveLabels(labels), [labels]);
  const formatters = useMemo(
    () => resolveAnnouncementFormatters(labels, resolvedLabels),
    [labels, resolvedLabels],
  );

  const accessibleLabel = resolveAccessibleLabel(ariaLabel, labels);
  const displayCount = formatBadgeCount(safeCount, labels?.formatBadgeCount);

  const announcement = useCartAnnouncement(safeCount, formatters);
  const motion = useCartFABMotion(disabled);
  const handleClick = useClickGuard(clickGuardMs, onClick);
  const focus = useFocusRestore({
    buttonRef,
    returnFocusRef,
    isVisible: shouldRender,
  });

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      focus.handleFocus();
      onFocus?.(event);
    },
    [focus, onFocus],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      focus.handleBlur();
      onBlur?.(event);
    },
    [focus, onBlur],
  );

  const buttonClassName = useMemo(
    () => buildButtonClassName(className, disabled),
    [className, disabled],
  );
  const resolvedBadgeClassName = useMemo(
    () => buildBadgeClassName(badgeClassName),
    [badgeClassName],
  );

  return (
    <>
      <LiveRegion message={announcement} />

      <LazyMotion features={domAnimation}>
        <AnimatePresence
          initial={false}
          onExitComplete={focus.handleExitComplete}
        >
          {shouldRender && (
            <m.button
              ref={mergedRef}
              type="button"
              initial={motion.hidden}
              animate={motion.visible}
              exit={motion.hidden}
              transition={motion.transition}
              whileHover={motion.whileHover}
              whileTap={motion.whileTap}
              onClick={handleClick}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-label={accessibleLabel}
              disabled={disabled}
              className={buttonClassName}
              {...buttonProps}
            >
              <span className={ICON_WRAPPER_CLASS} aria-hidden="true">
                <ShoppingBag className={ICON_CLASS} aria-hidden="true" />

                {safeCount > 0 && (
                  <CartBadge
                    count={safeCount}
                    label={displayCount}
                    className={resolvedBadgeClassName}
                    reduceMotion={motion.reduceMotion}
                    transition={motion.badgeTransition}
                  />
                )}
              </span>

              <span className={VISIBLE_TEXT_CLASS} aria-hidden="true">
                {resolvedLabels.visibleText}
              </span>
            </m.button>
          )}
        </AnimatePresence>
      </LazyMotion>
    </>
  );
});

CartFAB.displayName = "CartFAB";

export default CartFAB;