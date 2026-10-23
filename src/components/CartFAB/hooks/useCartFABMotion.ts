"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  BADGE_SPRING,
  BUTTON_SPRING,
  HIDDEN_STATE,
  HIDDEN_STATE_REDUCED,
  HOVER_STATE,
  INSTANT_TRANSITION,
  TAP_STATE,
  VISIBLE_STATE,
} from "../constants";

/** Single source of truth for every reduced-motion branch. */
export function useCartFABMotion(disabled: boolean) {
  const reduceMotion = useReducedMotion() ?? false;

  return useMemo(
    () => ({
      reduceMotion,
      transition: reduceMotion ? INSTANT_TRANSITION : BUTTON_SPRING,
      badgeTransition: reduceMotion ? INSTANT_TRANSITION : BADGE_SPRING,
      hidden: reduceMotion ? HIDDEN_STATE_REDUCED : HIDDEN_STATE,
      visible: VISIBLE_STATE,
      whileHover: reduceMotion || disabled ? undefined : HOVER_STATE,
      whileTap: reduceMotion || disabled ? undefined : TAP_STATE,
    }),
    [reduceMotion, disabled],
  );
}