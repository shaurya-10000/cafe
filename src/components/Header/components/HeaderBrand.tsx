import { memo } from "react";

import Link from "next/link";

import { HOME_PATH } from "../constants";
import { cn } from "../lib/cn";
import { FOCUS_RING } from "../styles";

export const HeaderBrand = memo(function HeaderBrand() {
  return (
    <Link
      href={HOME_PATH}
      aria-label="Cafe home"
      className={cn(
        "group flex shrink-0 items-center gap-3 rounded-xl",
        FOCUS_RING,
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center",
          "rounded-xl bg-cafe-accent",
          "shadow-lg shadow-cafe-accent/20",
          "transition-transform duration-200",
          "group-hover:scale-105",
          "motion-reduce:transition-none",
        )}
      >
        <span className="text-sm font-black uppercase text-cafe-accent-fg">
          C
        </span>
      </span>

      <span
        className={cn(
          "hidden sm:block",
          "text-xl font-black uppercase italic tracking-tighter",
          "text-cafe-fg",
        )}
      >
        Cafe
      </span>
    </Link>
  );
});
