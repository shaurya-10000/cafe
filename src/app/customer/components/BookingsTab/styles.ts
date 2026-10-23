import { getStatusBadgeStyle, getStatusIconWrapperStyle } from "./lib/status";
import type { BookingStatus } from "./types";

export const LIST_ROOT_CLASS = "space-y-6 pb-20";
export const LIST_CLASS = "space-y-6";

export const CARD_CLASS =
  "group flex list-none flex-col gap-6 rounded-[2.5rem] border border-cafe-border bg-cafe-card p-6 shadow-2xl transition-all hover:border-blue-500/30 lg:p-8";
export const CARD_TOP_ROW_CLASS =
  "flex flex-col justify-between gap-6 lg:flex-row lg:items-center";

export const SUMMARY_CLASS = "flex items-center gap-5 lg:gap-7";

export function buildStatusIconClass(status: BookingStatus): string {
  return `flex h-14 w-14 items-center justify-center rounded-2xl border transition-all lg:h-16 lg:w-16 ${getStatusIconWrapperStyle(status)}`;
}

export const ID_CLASS = "font-mono text-[9px] font-bold text-gray-500";

export function buildStatusBadgeClass(status: BookingStatus): string {
  return `rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest transition-colors ${getStatusBadgeStyle(status)}`;
}

export const LOCATION_CLASS =
  "flex items-center gap-1 rounded-full border border-cafe-border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-gray-500";
export const DATE_CLASS =
  "text-lg font-bold tracking-tight text-cafe-fg lg:text-xl";

export const PROGRESS_WRAPPER_CLASS = "w-full max-w-md flex-1 px-4 py-2";
export const PROGRESS_TRACK_CLASS =
  "relative mb-6 h-1 rounded-full bg-cafe-fg/10";
export const PROGRESS_FILL_CLASS =
  "absolute left-0 top-0 h-full rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]";
export const PROGRESS_DOTS_CLASS =
  "absolute top-1/2 flex w-full -translate-y-1/2 justify-between";

export function buildStepDotClass(isActive: boolean): string {
  return `h-2.5 w-2.5 rounded-full border-2 transition-all duration-700 ${
    isActive
      ? "scale-125 border-blue-600 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
      : "border-cafe-border bg-cafe-card"
  }`;
}

export function buildStepLabelClass(isActive: boolean): string {
  return `absolute top-5 whitespace-nowrap text-[7px] font-black uppercase tracking-widest transition-colors duration-500 ${
    isActive ? "text-cafe-fg" : "text-gray-500"
  }`;
}

export const ACTIONS_CLASS =
  "flex items-center justify-between gap-4 border-t border-cafe-border pt-4 lg:justify-end lg:border-0 lg:pt-0";
export const PARTY_LABEL_CLASS =
  "mb-1 text-[9px] font-black uppercase tracking-widest text-gray-500";
export const PARTY_VALUE_CLASS =
  "flex items-center gap-2 font-mono text-2xl font-bold leading-none text-cafe-fg";

export const CANCEL_BUTTON_CLASS =
  "flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2";

export const NOTE_CLASS =
  "flex items-start gap-2.5 rounded-xl border border-cafe-border bg-cafe-fg/[0.02] px-4 py-3";

export const SKELETON_CARD_CLASS =
  "flex animate-pulse items-center gap-5 rounded-[2.5rem] border border-cafe-border bg-cafe-card p-6 lg:p-8";

export const ERROR_STATE_CLASS =
  "space-y-3 rounded-[3rem] border border-red-500/30 bg-red-500/5 py-20 text-center";
export const EMPTY_STATE_CLASS =
  "rounded-[3rem] border border-dashed border-cafe-border py-32 text-center";

export const CANCEL_ERROR_CLASS =
  "flex items-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-xs font-bold text-red-500";