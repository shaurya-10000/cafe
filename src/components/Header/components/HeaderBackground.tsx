import { memo } from "react";

import { motion, type MotionValue } from "framer-motion";

import { cn } from "../lib/cn";

interface HeaderBackgroundProps {
  opacity: MotionValue<number> | null;
}

export const HeaderBackground = memo(function HeaderBackground({
  opacity,
}: HeaderBackgroundProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={opacity ? { opacity } : undefined}
    >
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-b",
          "from-cafe-fg/[0.04] via-cafe-fg/[0.02] to-transparent",
        )}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-16",
          "bg-gradient-to-b",
          "from-transparent to-cafe-bg",
        )}
      />
    </motion.div>
  );
});
