import { memo } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "../lib/cn";
import { formatBadgeCount } from "../lib/format";

interface CountBadgeProps {
  count: number;
  max?: number;
  animate?: boolean;
  prefersReducedMotion?: boolean;
}

const BADGE_CLASS_NAME = cn(
  "absolute right-1.5 top-1.5",
  "flex h-5 min-w-5 items-center justify-center",
  "rounded-full border-2 border-cafe-bg",
  "bg-cafe-accent text-cafe-accent-fg",
  "px-1 text-[10px] font-black shadow-lg",
);

export const CountBadge = memo(function CountBadge({
  count,
  max = 9,
  animate = false,
  prefersReducedMotion = false,
}: CountBadgeProps) {
  const badge = formatBadgeCount(count, max);

  if (!animate) {
    return badge ? (
      <span aria-hidden="true" className={BADGE_CLASS_NAME}>
        {badge}
      </span>
    ) : null;
  }

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {badge && (
        <motion.span
          key={badge}
          initial={
            prefersReducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.7 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }
          }
          transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
          aria-hidden="true"
          className={BADGE_CLASS_NAME}
        >
          {badge}
        </motion.span>
      )}
    </AnimatePresence>
  );
});
