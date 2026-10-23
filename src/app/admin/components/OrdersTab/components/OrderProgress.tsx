import { memo } from "react";

import { motion } from "framer-motion";

import { STATUS_STEPS } from "../constants";
import { cx } from "../lib/cx";
import { getProgressWidth, getStatusStepIndex } from "../lib/orders";

interface OrderProgressProps {
  status: string;
  reducedMotion: boolean;
}

export const OrderProgress = memo(function OrderProgress({
  status,
  reducedMotion,
}: OrderProgressProps) {
  const currentIndex = getStatusStepIndex(status);

  return (
    <div className="hidden w-full max-w-md flex-1 px-4 xl:block">
      <div className="relative mb-6 h-1 rounded-full bg-cafe-fg/10">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: getProgressWidth(status) }}
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", damping: 20 }
          }
        />

        <div className="absolute top-1/2 flex w-full -translate-y-1/2 justify-between">
          {STATUS_STEPS.map((step, index) => {
            const reached = currentIndex >= index;

            return (
              <div key={step} className="relative flex flex-col items-center">
                <div
                  aria-hidden="true"
                  className={cx(
                    "h-3 w-3 rounded-full border-2 transition-all duration-500",
                    reached
                      ? "scale-125 border-blue-600 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]"
                      : "border-cafe-border bg-cafe-card",
                  )}
                />

                <span
                  className={cx(
                    "absolute top-5 whitespace-nowrap text-[7px] font-black uppercase tracking-widest",
                    reached ? "text-cafe-fg" : "text-gray-500",
                  )}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
