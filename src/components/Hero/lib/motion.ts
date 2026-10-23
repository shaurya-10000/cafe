import type { Variants } from "framer-motion";

import { EASE_CINEMATIC } from "../constants";
import type { HeroMotionConfig } from "../types";

/**
 * All variants and transitions are built from a single `reducedMotion`
 * flag so there is exactly one decision point about whether to animate.
 * Every value that could cause vestibular discomfort (y-offsets, scale
 * transforms, stagger delays) collapses to a static reveal when motion
 * is reduced.
 */
export function buildHeroMotion(reducedMotion: boolean): HeroMotionConfig {
  const containerTransition = reducedMotion
    ? { staggerChildren: 0, delayChildren: 0 }
    : { staggerChildren: 0.1, delayChildren: 0.3 };

  const itemTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 1.4, ease: EASE_CINEMATIC };

  const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: containerTransition,
    },
  };

  const itemVariants: Variants = {
    initial: {
      opacity: 0,
      y: reducedMotion ? 0 : 15,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: itemTransition,
    },
  };

  const backgroundVariants: Variants = {
    initial: {
      opacity: 0,
      scale: reducedMotion ? 1 : 1.1,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: reducedMotion
        ? { duration: 0 }
        : { duration: 2, ease: EASE_CINEMATIC },
    },
  };

  const stampVariants: Variants = {
    initial: { y: reducedMotion ? 0 : "100%" },
    animate: {
      y: 0,
      transition: reducedMotion ? { duration: 0 } : { delay: 1, duration: 1 },
    },
  };

  return {
    containerVariants,
    itemVariants,
    backgroundVariants,
    stampVariants,
  };
}