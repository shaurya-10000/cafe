import type { MotionProps } from "framer-motion";

type MotionPreset = Pick<
  MotionProps,
  "initial" | "animate" | "exit" | "transition"
>;

/** Short fade + vertical nudge; collapses to an instant swap when reduced. */
export function getFadeSlideMotion(
  reducedMotion: boolean,
  enterOffsetY = 4,
): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: enterOffsetY },
    animate: { opacity: 1, y: 0 },
    exit: reducedMotion ? undefined : { opacity: 0, y: -4 },
    transition: { duration: reducedMotion ? 0 : 0.15 },
  };
}
