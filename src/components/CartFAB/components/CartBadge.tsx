"use client";

import { m } from "framer-motion";
import type { Transition } from "framer-motion";

interface CartBadgeProps {
  /** Normalized count; used as the remount key so the spring replays. */
  count: number;
  label: string;
  className: string;
  reduceMotion: boolean;
  transition: Transition;
}

export function CartBadge({
  count,
  label,
  className,
  reduceMotion,
  transition,
}: CartBadgeProps) {
  return (
    <m.span
      key={count}
      layout="position"
      initial={reduceMotion ? false : { scale: 1.4 }}
      animate={{ scale: 1 }}
      transition={transition}
      className={className}
      aria-hidden="true"
    >
      {label}
    </m.span>
  );
}