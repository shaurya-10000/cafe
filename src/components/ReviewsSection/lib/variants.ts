import type { Variants } from "framer-motion";

import {
  FULL_MOTION_CONTAINER_TRANSITION,
  FULL_MOTION_ITEM_TRANSITION,
  REDUCED_MOTION_TRANSITION,
} from "../constants";

export function getContainerVariants(reducedMotion: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: reducedMotion
        ? REDUCED_MOTION_TRANSITION
        : FULL_MOTION_CONTAINER_TRANSITION,
    },
  };
}

export function getItemVariants(reducedMotion: boolean): Variants {
  return {
    hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reducedMotion
        ? REDUCED_MOTION_TRANSITION
        : FULL_MOTION_ITEM_TRANSITION,
    },
  };
}
