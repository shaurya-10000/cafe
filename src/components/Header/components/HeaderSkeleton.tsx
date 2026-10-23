import { memo } from "react";

import { Z_HEADER } from "../constants";
import {
  HEADER_SHELL,
  MIN_TOUCH_TARGET,
  NAV_RADIUS_DEFAULT,
  NAV_SHELL_SKELETON,
} from "../styles";
import { cn } from "../lib/cn";

const SKELETON_ACTION_COUNT = 3;

export const HeaderSkeleton = memo(function HeaderSkeleton() {
  return (
    <header
      className={HEADER_SHELL}
      style={{
        zIndex: Z_HEADER,
        paddingTop: "env(safe-area-inset-top)",
      }}
      aria-hidden="true"
    >
      <div className={cn(NAV_SHELL_SKELETON, NAV_RADIUS_DEFAULT)}>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-cafe-fg/10" />

        <div className="flex items-center gap-2 md:gap-4">
          {Array.from({ length: SKELETON_ACTION_COUNT }, (_, index) => (
            <div
              key={index}
              className={cn(
                MIN_TOUCH_TARGET,
                "animate-pulse rounded-2xl bg-cafe-fg/10",
              )}
            />
          ))}
        </div>
      </div>
    </header>
  );
});
