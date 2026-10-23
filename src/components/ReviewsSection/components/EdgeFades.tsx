import { memo } from "react";

import { cn } from "@/lib/utils";

/** Palette-aware gradients that fade the marquee into the background. */
export const EdgeFades = memo(function EdgeFades() {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-10 h-full w-16",
          "bg-gradient-to-r from-cafe-bg to-transparent",
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-0 top-0 z-10 h-full w-16",
          "bg-gradient-to-l from-cafe-bg to-transparent",
        )}
      />
    </>
  );
});
