import { joinClasses } from "./lib/joinClasses";

const BUTTON_BASE = [
  "fixed",
  "right-4 sm:right-8",
  "rtl:left-4 rtl:right-auto",
  "rtl:sm:left-8 rtl:sm:right-auto",
  "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
  "sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]",
  "z-50",
  "flex min-h-11 min-w-11 items-center gap-3",
  "rounded-full",
  "bg-zinc-900 dark:bg-zinc-100",
  "py-4 pl-4 pr-6",
  "rtl:pl-6 rtl:pr-4",
  "text-white dark:text-black",
  "shadow-2xl",
  "select-none",
  "touch-manipulation",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-zinc-900",
  "focus-visible:ring-offset-2",
  "dark:focus-visible:ring-zinc-100",
  "dark:focus-visible:ring-offset-zinc-950",
] as const;

const BADGE_BASE = [
  "absolute",
  "-right-2.5 -top-2.5",
  "rtl:-left-2.5 rtl:right-auto",
  "flex h-5 min-w-5 items-center justify-center",
  "rounded-full",
  "border-2",
  "border-zinc-900 dark:border-zinc-100",
  "px-1",
  "text-[10px] font-black leading-none text-white",
] as const;

const DEFAULT_BADGE_BACKGROUND = "bg-cafe-accent";

export const ICON_WRAPPER_CLASS =
  "relative flex shrink-0 items-center justify-center";

export const ICON_CLASS = "h-5 w-5";

export const VISIBLE_TEXT_CLASS =
  "text-xs font-black uppercase leading-none tracking-widest";

export const LIVE_REGION_CLASS = "sr-only";

export function buildButtonClassName(
  className: string | undefined,
  disabled: boolean,
): string {
  return joinClasses(
    ...BUTTON_BASE,
    disabled && "cursor-not-allowed opacity-50",
    className,
  );
}

/** `undefined` → default background. `""` → explicitly no background. */
export function buildBadgeClassName(badgeClassName: string | undefined): string {
  return joinClasses(
    ...BADGE_BASE,
    badgeClassName !== undefined ? badgeClassName : DEFAULT_BADGE_BACKGROUND,
  );
}