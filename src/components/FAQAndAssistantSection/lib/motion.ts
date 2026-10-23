import type { MotionProps, Variants } from "framer-motion";

type MotionPreset = Pick<
  MotionProps,
  "initial" | "animate" | "exit" | "transition"
>;

export function getHeaderVariants(reducedMotion: boolean): Variants {
  return {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.6, ease: "easeOut" },
    },
  };
}

export function getListVariants(reducedMotion: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reducedMotion ? 0 : 0.04 },
    },
  };
}

export function getRowMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: reducedMotion ? undefined : { opacity: 0 },
    transition: { duration: reducedMotion ? 0 : 0.35, ease: "easeOut" },
  };
}

export function getAnswerMotion(reducedMotion: boolean): MotionPreset {
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
    transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
  };
}

export function getEmptyStateMotion(reducedMotion: boolean): MotionPreset {
  return {
    initial: reducedMotion ? false : { opacity: 0 },
    animate: { opacity: 1 },
    exit: reducedMotion ? undefined : { opacity: 0 },
  };
}
