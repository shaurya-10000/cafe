"use client";

import { motion, useReducedMotion } from "framer-motion";

import { PROGRESS_SPRING, STATUS_STEPS } from "../constants";
import { getProgressWidth, getStatusIndex } from "../lib/status";
import {
  PROGRESS_DOTS_CLASS,
  PROGRESS_FILL_CLASS,
  PROGRESS_TRACK_CLASS,
  PROGRESS_WRAPPER_CLASS,
  buildStepDotClass,
  buildStepLabelClass,
} from "../styles";

/** Progress bar + step dots for an in-flight order. */
export function StatusProgress({ status }: { status: string }) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const statusIndex = getStatusIndex(status);

  return (
    <div className={PROGRESS_WRAPPER_CLASS}>
      <div className={PROGRESS_TRACK_CLASS}>
        <motion.div
          className={PROGRESS_FILL_CLASS}
          initial={shouldReduceMotion ? false : { width: 0 }}
          animate={{ width: getProgressWidth(status) }}
          transition={shouldReduceMotion ? { duration: 0 } : PROGRESS_SPRING}
        />
        <div className={PROGRESS_DOTS_CLASS}>
          {STATUS_STEPS.map((step, index) => {
            const isActive = statusIndex !== -1 && statusIndex >= index;

            return (
              <div key={step} className="relative flex flex-col items-center">
                <div aria-hidden="true" className={buildStepDotClass(isActive)} />
                <span className={buildStepLabelClass(isActive)}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}