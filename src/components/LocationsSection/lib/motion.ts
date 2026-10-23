import type { MotionProps } from "framer-motion";

type MotionPreset = Pick<
  MotionProps,
  "initial" | "animate" | "exit" | "transition"
>;

/** Slide transition between locations; opacity-only for reduced motion. */
export function getSlideMotion(reduceMotion: boolean): MotionPreset {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  };
}

/** Copy <-> check icon swap. */
export function getIconSwapMotion(reduceMotion: boolean): MotionPreset {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0 },
    };
  }

  return {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
  };
}
