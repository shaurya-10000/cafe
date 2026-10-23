import type { MotionProps } from "framer-motion";

type MotionPreset = Pick<
  MotionProps,
  "initial" | "animate" | "exit" | "transition"
>;

export function getBackdropMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0 },
    animate: { opacity: 1 },
    exit: reducedMotion ? undefined : { opacity: 0 },
    transition: { duration: reducedMotion ? 0 : 0.2 },
  };
}

export function getTabPanelMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
    transition: { duration: reducedMotion ? 0 : 0.2 },
  };
}
