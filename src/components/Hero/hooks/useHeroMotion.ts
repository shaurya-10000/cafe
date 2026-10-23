"use client";

import { useMemo } from "react";

import { useReducedMotion } from "framer-motion";

import { buildHeroMotion } from "../lib";
import type { HeroMotionConfig } from "../types";

export function useHeroMotion(): HeroMotionConfig {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return useMemo(
    () => buildHeroMotion(shouldReduceMotion),
    [shouldReduceMotion],
  );
}