import type { MotionProps, Variants } from "framer-motion";

type MotionPreset = Pick<MotionProps, "initial" | "animate" | "exit">;

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15, mass: 1 },
  },
};

/** Reduced motion renders children statically: no variants at all. */
export function getItemVariants(reducedMotion: boolean): Variants | undefined {
  return reducedMotion ? undefined : itemVariants;
}

export function getScaleFadeMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: reducedMotion ? undefined : { opacity: 0, scale: 0.95 },
  };
}

export function getFadeMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0 },
    animate: { opacity: 1 },
    exit: reducedMotion ? undefined : { opacity: 0 },
  };
}
