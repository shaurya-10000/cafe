"use client";

import { motion, useReducedMotion } from "framer-motion";

import { BOOKING_STEPS, PROGRESS_SPRING } from "../constants";
import { getProgressWidth, isStepActive } from "../lib/status";
import {
  PROGRESS_DOTS_CLASS,
  PROGRESS_FILL_CLASS,
  PROGRESS_TRACK_CLASS,
  PROGRESS_WRAPPER_CLASS,
  buildStepDotClass,
  buildStepLabelClass,
} from "../styles";
import type { BookingStatus } from "../types";

export function BookingProgress({ status }: { status: BookingStatus }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

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
          {BOOKING_STEPS.map((step, index) => {
            const active = isStepActive(status, index);

            return (
              <div key={step} className="relative flex flex-col items-center">
                <div aria-hidden="true" className={buildStepDotClass(active)} />
                <span className={buildStepLabelClass(active)}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}