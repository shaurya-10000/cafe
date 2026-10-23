import {
  Candy,
  Cat,
  Flame,
  Ghost,
  Gift,
  Moon,
  PartyPopper,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Trees,
  Wine,
  Zap,
} from "lucide-react";

import { Bat, Firecracker, Pumpkin } from "./components/icons";
import type { DateBoundary, Season, SeasonConfig } from "./types";

export const IS_DEV = process.env.NODE_ENV !== "production";

export const DEFAULT_PARTICLE_COUNT = 28;
export const DEFAULT_REFRESH_INTERVAL_MS = 60_000;
export const DEFAULT_TIMEZONE = "GMT";
export const DEFAULT_Z_INDEX_CLASSNAME = "z-0";
export const MOBILE_BREAKPOINT_PX = 640;
export const MIN_PARTICLE_COUNT = 1;
export const MAX_PARTICLE_COUNT = 200;
export const MIN_REFRESH_INTERVAL_MS = 5_000;
export const AUTO_LOW_THRESHOLD = 60;
export const FORCED_HIGH_WARN_THRESHOLD = 80;
export const CSS_KEYFRAMES_ID = "seasonal-bg-particle-keyframes";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const NARROW_VIEWPORT_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;

export const SEASON_CONFIG: Readonly<Record<Season, SeasonConfig>> = {
  halloween: {
    icons: [Ghost, Pumpkin, Bat, Skull, Candy, Cat, Flame, Moon],
    color: "text-orange-500/80 dark:text-amber-500/80",
    glow: "rgba(249, 115, 22, 0.55)",
    driftDirection: -1,
  },

  christmas: {
    icons: [Trees, Snowflake, Gift, Star, PartyPopper],
    color: "text-emerald-400/80 dark:text-rose-400/80",
    glow: "rgba(244, 63, 94, 0.5)",
    driftDirection: 1,
  },

  newyear: {
    icons: [Firecracker, Sparkles, Zap, Flame, PartyPopper, Wine, Star],
    color: "text-yellow-400/80 dark:text-amber-300/80",
    glow: "rgba(251, 191, 36, 0.55)",
    driftDirection: -1,
  },

  default: {
    icons: [Star, Sparkles, Sun, Moon],
    color: "text-amber-200/60 dark:text-zinc-200/60",
    glow: "rgba(255, 255, 255, 0.5)",
    driftDirection: -1,
  },
};

export const DEFAULT_SEASON_BOUNDARIES: readonly DateBoundary[] = [
  {
    season: "halloween",
    start: { month: 10, day: 1 },
    end: { month: 10, day: 31 },
  },
  {
    season: "christmas",
    start: { month: 12, day: 1 },
    end: { month: 12, day: 26 },
  },
  {
    season: "newyear",
    start: { month: 12, day: 27 },
    end: { month: 12, day: 31 },
  },
  {
    season: "newyear",
    start: { month: 1, day: 1 },
    end: { month: 1, day: 5 },
  },
];

export const SEASONAL_BACKGROUND_KEYFRAMES_CSS = `
@keyframes seasonal-bg-drift {
  0% {
    opacity: 0;
    transform: translateY(0) rotate(var(--sb-rot));
  }

  50% {
    opacity: .7;
    transform: translateY(var(--sb-drift))
      rotate(calc(var(--sb-rot) + 25deg));
  }

  100% {
    opacity: 0;
    transform: translateY(0) rotate(var(--sb-rot));
  }
}

@media (prefers-reduced-motion: reduce) {
  .seasonal-bg-particle {
    animation: none !important;
  }
}
`;