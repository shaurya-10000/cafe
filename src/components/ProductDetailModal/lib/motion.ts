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

export function getDialogMotion(reducedMotion: boolean): MotionPreset {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 24, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 24, scale: 0.97 },
    transition: { type: "spring", damping: 26, stiffness: 300 },
  };
}

export function getImageFadeMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reducedMotion ? 0 : 0.3 },
  };
}
