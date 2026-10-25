import type { ViewOption } from "./types";

export const ROOT_CLASS = "space-y-6 pb-20";

export const SWITCHER_CLASS =
  "flex max-w-full flex-wrap gap-2 overflow-x-auto rounded-2xl border border-cafe-border bg-cafe-fg/5 p-1 text-[9px] font-bold uppercase tracking-widest";

export function buildViewButtonClass(
  isActive: boolean,
  option: ViewOption,
): string {
  return [
    "whitespace-nowrap rounded-xl px-5 py-2.5 transition-all focus:outline-none focus-visible:ring-2",
    option.focusRingClass,
    isActive ? option.activeClass : "text-gray-500 hover:text-cafe-fg",
  ].join(" ");
}

export const EMPTY_CLASS =
  "rounded-[3rem] border border-dashed border-cafe-border py-32 text-center";
export const EMPTY_ICON_CLASS = "mx-auto mb-4 text-gray-500/50";
export const EMPTY_TEXT_CLASS =
  "text-[10px] font-black uppercase tracking-widest text-gray-500";

export const CARD_CLASS =
  "group flex flex-col gap-8 rounded-[2.5rem] border border-cafe-border bg-cafe-card p-6 shadow-2xl transition-all hover:border-cafe-accent/30 lg:p-8";
export const CARD_TOP_ROW_CLASS =
  "flex flex-col justify-between gap-6 lg:flex-row lg:items-center";

export const SUMMARY_CLASS = "flex items-center gap-5 lg:gap-7";

export function buildStatusIconClass(wrapperClass: string): string {
  return `flex h-14 w-14 items-center justify-center rounded-2xl border transition-all lg:h-16 lg:w-16 ${wrapperClass}`;
}

export const ORDER_ID_CLASS = "font-mono text-[9px] font-bold text-gray-500";

export function buildStatusBadgeClass(status: string): string {
  return `rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest transition-colors ${
    status === "ready"
      ? "border-transparent bg-green-600 text-white"
      : "border-cafe-border bg-cafe-fg/5 text-gray-500"
  }`;
}

export const DATE_CLASS =
  "text-lg font-bold tracking-tight text-cafe-fg lg:text-xl";

export const PROGRESS_WRAPPER_CLASS = "w-full max-w-md flex-1 px-4 py-2";
export const PROGRESS_TRACK_CLASS =
  "relative mb-6 h-1 rounded-full bg-cafe-fg/10";
export const PROGRESS_FILL_CLASS =
  "absolute left-0 top-0 h-full rounded-full bg-cafe-accent shadow-[0_0_15px_var(--accent-ring)]";
export const PROGRESS_DOTS_CLASS =
  "absolute top-1/2 flex w-full -translate-y-1/2 justify-between";

export function buildStepDotClass(isActive: boolean): string {
  return `h-2.5 w-2.5 rounded-full border-2 transition-all duration-700 ${
    isActive
      ? "scale-125 border-cafe-accent bg-cafe-accent shadow-[0_0_8px_var(--accent-ring)]"
      : "border-cafe-border bg-cafe-card"
  }`;
}

export function buildStepLabelClass(isActive: boolean): string {
  return `absolute top-5 whitespace-nowrap text-[7px] font-black uppercase tracking-widest transition-colors duration-500 ${
    isActive ? "text-cafe-fg" : "text-gray-500"
  }`;
}

export const TOTAL_ROW_CLASS =
  "flex items-center justify-between gap-8 border-t border-cafe-border pt-4 lg:justify-end lg:border-0 lg:pt-0";
export const TOTAL_LABEL_CLASS =
  "mb-1 text-[9px] font-black uppercase tracking-widest text-gray-500";
export const TOTAL_VALUE_CLASS =
  "font-mono text-2xl font-bold leading-none text-cafe-fg";

export const RATE_BUTTON_CLASS =
  "flex items-center gap-2 rounded-2xl bg-cafe-accent px-5 py-4 text-[10px] font-black uppercase tracking-widest text-cafe-accent-fg transition-all hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2";
export const DETAILS_BUTTON_CLASS =
  "cursor-not-allowed rounded-2xl border border-cafe-border bg-cafe-fg/5 p-4 text-gray-400 dark:text-gray-600";

export const ITEMS_ROW_CLASS =
  "flex flex-wrap gap-2 border-t border-cafe-border pt-6";
export const ITEM_CHIP_CLASS =
  "group/item flex items-center gap-2.5 rounded-xl border border-cafe-border bg-cafe-fg/[0.03] px-3 py-1.5 transition-colors hover:border-cafe-accent/20";
export const ITEM_ICON_CLASS =
  "text-gray-500 transition-colors group-hover/item:text-cafe-accent";
export const ITEM_NAME_CLASS =
  "text-[10px] font-bold text-gray-500 transition-colors group-hover/item:text-cafe-fg";
export const ITEM_QTY_CLASS =
  "min-w-[20px] rounded-md bg-cafe-accent/10 px-1.5 py-0.5 text-center text-[10px] font-black text-cafe-accent";

export const SCHEDULED_MARKER_CLASS =
  "flex items-center gap-2 text-[10px] font-bold text-gray-500";