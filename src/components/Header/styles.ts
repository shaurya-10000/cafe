import { cn } from "./lib/cn";

export const FOCUS_RING = cn(
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-cafe-accent",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-cafe-bg",
);

export const ICON_BUTTON_BASE = cn(
  "relative rounded-2xl",
  "text-cafe-fg/60",
  "transition-colors duration-200",
  "hover:bg-cafe-fg/5 hover:text-cafe-fg",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export const MIN_TOUCH_TARGET = "min-h-11 min-w-11";

export const HEADER_SHELL =
  "fixed inset-x-0 top-0 flex h-28 items-center md:h-32";

export const NAV_SHELL_BASE = cn(
  "relative mx-4 flex w-full items-center justify-between",
  "border border-cafe-border bg-cafe-card",
  "px-4 py-4 sm:mx-6 sm:px-6 md:mx-10 md:px-10",
  "shadow-2xl backdrop-blur-3xl",
  "transition-[border-radius] duration-300",
);

export const NAV_SHELL_SKELETON = cn(
  "relative mx-4 flex w-full items-center justify-between",
  "border border-cafe-border bg-cafe-card",
  "px-4 py-4 sm:mx-6 sm:px-6 md:mx-10 md:px-10",
  "shadow-2xl",
  "transition-[border-radius] duration-300",
);

export const NAV_RADIUS_DEFAULT = "rounded-[2rem] md:rounded-[2.5rem]";
export const NAV_RADIUS_DASHBOARD = "rounded-2xl";
