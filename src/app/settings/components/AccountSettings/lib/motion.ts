import type { MotionProps } from "framer-motion";

type MotionPreset = Pick<
  MotionProps,
  "initial" | "animate" | "exit" | "transition"
>;

export function getBannerMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 },
    animate: reducedMotion
      ? { opacity: 1 }
      : { opacity: 1, height: "auto" },
    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 },
    transition: { duration: reducedMotion ? 0 : 0.2 },
  };
}
