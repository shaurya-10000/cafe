import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  useAnimationFrame,
  useMotionValue,
  type MotionValue,
} from "framer-motion";

import { CARD_GAP_PX, MAX_FRAME_DELTA_MS } from "../constants";
import { wrapPosition } from "../lib/position";
import { useDocumentVisibility } from "./useDocumentVisibility";
import { useMeasuredWidth } from "./useMeasuredWidth";

interface UseMarqueeOptions {
  itemCount: number;
  /** Pixels per second. */
  autoScrollSpeed: number;
  shouldReduceMotion: boolean;
  /** Hover, focus, drag or an explicit pause. */
  isSuspended: boolean;
}

export interface UseMarqueeResult {
  x: MotionValue<number>;
  /** Attach to the first (real) set of cards; its width is the loop length. */
  firstSetRef: RefObject<HTMLDivElement | null>;
  canScroll: boolean;
  /** Approximate visible index, used only for the live-region announcement. */
  activeIndex: number;
  normalizePosition: () => void;
  previous: () => void;
  next: () => void;
  home: () => void;
  end: () => void;
}

export function useMarquee({
  itemCount,
  autoScrollSpeed,
  shouldReduceMotion,
  isSuspended,
}: UseMarqueeOptions): UseMarqueeResult {
  const isDocumentVisible = useDocumentVisibility();

  const firstSetRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const [activeIndex, setActiveIndex] = useState(0);

  const firstSetWidth = useMeasuredWidth(firstSetRef, itemCount);

  const canScroll = itemCount > 1 && firstSetWidth > 0;

  const normalizePosition = useCallback(() => {
    if (firstSetWidth <= 0) return;

    x.set(wrapPosition(x.get(), firstSetWidth));
  }, [firstSetWidth, x]);

  // Re-wrap when measurement completes or the content changes.
  useEffect(() => {
    normalizePosition();
  }, [normalizePosition]);

  // Continuous scroll loop.
  useAnimationFrame((_, delta) => {
    if (
      shouldReduceMotion ||
      !canScroll ||
      isSuspended ||
      !isDocumentVisible ||
      autoScrollSpeed <= 0
    ) {
      return;
    }

    const safeDelta = Math.min(
      Math.max(Number.isFinite(delta) ? delta : 0, 0),
      MAX_FRAME_DELTA_MS,
    );

    const distance = (autoScrollSpeed * safeDelta) / 1000;

    x.set(wrapPosition(x.get() - distance, firstSetWidth));
  });

  const moveByOneCard = useCallback(
    (direction: "previous" | "next") => {
      if (!canScroll) return;

      const firstCard = firstSetRef.current?.firstElementChild;

      if (!(firstCard instanceof HTMLElement)) return;

      const cardWidth = firstCard.getBoundingClientRect().width;

      if (!Number.isFinite(cardWidth) || cardWidth <= 0) return;

      const currentX = x.get();
      const safeCurrentX = Number.isFinite(currentX) ? currentX : 0;
      const step = cardWidth + CARD_GAP_PX;

      x.set(
        wrapPosition(
          direction === "next" ? safeCurrentX - step : safeCurrentX + step,
          firstSetWidth,
        ),
      );

      setActiveIndex((current) => {
        if (itemCount === 0) return current;
        if (direction === "next") return (current + 1) % itemCount;
        return (current - 1 + itemCount) % itemCount;
      });
    },
    [canScroll, firstSetWidth, itemCount, x],
  );

  const previous = useCallback(() => moveByOneCard("previous"), [moveByOneCard]);
  const next = useCallback(() => moveByOneCard("next"), [moveByOneCard]);

  const home = useCallback(() => {
    if (firstSetWidth <= 0) return;

    x.set(0);
    setActiveIndex(0);
  }, [firstSetWidth, x]);

  const end = useCallback(() => {
    if (firstSetWidth <= 0) return;

    x.set(-firstSetWidth);
    setActiveIndex(Math.max(0, itemCount - 1));
  }, [firstSetWidth, itemCount, x]);

  return {
    x,
    firstSetRef,
    canScroll,
    activeIndex,
    normalizePosition,
    previous,
    next,
    home,
    end,
  };
}
