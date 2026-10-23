"use client";

import { useEffect } from "react";

import { ensureCssKeyframes } from "../lib/keyframes";
import type { ResolvedPerformanceMode } from "../types";

/** Injects the CSS-mode keyframes only when CSS rendering is in use. */
export function useCssKeyframes(mode: ResolvedPerformanceMode): void {
  useEffect(() => {
    if (mode === "low") {
      ensureCssKeyframes();
    }
  }, [mode]);
}