import type { MotionProps } from "framer-motion";

type MotionPreset = Pick<
  MotionProps,
  "initial" | "animate" | "exit" | "transition"
>;

export function getOverlayMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0 },
    animate: { opacity: 1 },
    exit: reducedMotion ? undefined : { opacity: 0 },
  };
}

/** Slide-in drawer; opacity-only for reduced motion. */
export function getPanelMotion(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { type: "spring", damping: 25, stiffness: 200 },
  };
}

/** Height collapse for the preferences drawer. */
export function getCollapseMotion(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.25 },
  };
}

export function getCardMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 },
  };
}
