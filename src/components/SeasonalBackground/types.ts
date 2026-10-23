import type { ComponentType, CSSProperties } from "react";

export type Season = "halloween" | "christmas" | "newyear" | "default";
export type PerformanceMode = "auto" | "high" | "low";
export type ResolvedPerformanceMode = Exclude<PerformanceMode, "auto">;

export interface IconProps {
  size?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconProps>;

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  iconIndex: number;
  drift: number;
}

export interface SeasonConfig {
  icons: readonly IconComponent[];
  color: string;
  glow: string;
  driftDirection: 1 | -1;
}

export type MonthDay = Readonly<{ month: number; day: number }>;

export interface DateBoundary {
  season: Exclude<Season, "default">;
  start: MonthDay;
  end: MonthDay;
}

export interface SeasonalBackgroundProps {
  /** Explicit season. When omitted, the calendar + timezone determine it. */
  season?: Season;

  /** IANA timezone used by automatic season detection. Default: GMT. */
  timeZone?: string;

  /** Maximum desktop particle count. Default: 28; bounded to 1..200. */
  particleCount?: number;

  /** Calendar refresh interval. Minimum 5000ms; default 60000ms. */
  refreshIntervalMs?: number;

  /** `auto` selects Framer Motion <=60 particles and CSS above 60. */
  performance?: PerformanceMode;

  /** Ordered, non-cross-year seasonal ranges. First matching range wins. */
  seasonBoundaries?: readonly DateBoundary[];

  /** Additional classes for the fixed decorative layer. */
  className?: string;

  /** Stacking class for the decorative layer. Default: z-0. */
  zIndexClassName?: string;
}

export interface ParticleViewProps {
  particle: Particle;
  Icon: IconComponent;
  color: string;
  reduceMotion: boolean;
  documentVisible: boolean;
}

export interface ParticleMotionProps extends ParticleViewProps {
  glow: string;
}

export type ParticleCssVars = CSSProperties & {
  "--sb-rot"?: string;
  "--sb-drift"?: string;
};