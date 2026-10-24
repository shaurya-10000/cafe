import { joinClasses } from "./lib/joinClasses";
import type { BadgeTone } from "./types";

export const ROOT_CLASS =
  "relative app-shell flex h-screen overflow-hidden bg-cafe-bg font-sans text-cafe-fg transition-colors duration-300";

export const OVERLAY_CLASS =
  "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm dark:bg-black/80";

const SIDEBAR_BASE = [
  "fixed left-0 top-0 z-[70] flex h-full w-72 shrink-0 flex-col",
  "border-r border-cafe-border bg-cafe-card p-8 backdrop-blur-xl",
  "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
] as const;

export function buildSidebarClassName(isOpen: boolean): string {
  return joinClasses(
    ...SIDEBAR_BASE,
    isOpen ? "translate-x-0" : "-translate-x-full",
  );
}

export const BRAND_ICON_WRAPPER_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-xl bg-cafe-fg shadow-lg shadow-cafe-fg/5";

export const BRAND_NAME_CLASS =
  "text-xl font-bold uppercase italic tracking-tighter text-cafe-fg";

export const SIDEBAR_CLOSE_CLASS =
  "text-gray-500 transition-transform duration-300 hover:rotate-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

const NAV_ITEM_BASE = [
  "flex items-center justify-between rounded-2xl px-5 py-4",
  "text-[11px] font-black uppercase tracking-widest transition-all",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset",
] as const;

export function buildNavItemClassName(isActive: boolean): string {
  return joinClasses(
    ...NAV_ITEM_BASE,
    isActive
      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
      : "text-gray-500 hover:bg-cafe-fg/5 hover:text-cafe-fg",
  );
}

export function buildBadgeClassName(
  isActive: boolean,
  tone: BadgeTone,
): string {
  const palette = isActive
    ? "bg-white text-blue-600"
    : tone === "red"
      ? "bg-red-500 text-white"
      : "bg-blue-600 text-white";

  return joinClasses(
    "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
    palette,
  );
}

export const HEADER_CLASS =
  "z-10 flex h-24 shrink-0 items-center justify-between border-b border-cafe-border bg-cafe-bg/80 px-6 backdrop-blur-xl md:px-12";

export const MENU_BUTTON_CLASS =
  "rounded-2xl border border-cafe-border bg-cafe-fg/5 p-3 text-cafe-fg transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

export const BACK_BUTTON_CLASS =
  "group flex items-center gap-2 rounded-full bg-cafe-fg px-6 py-2.5 text-cafe-bg shadow-xl shadow-cafe-fg/5 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

export const ERROR_BANNER_CLASS =
  "mx-6 mt-4 flex shrink-0 items-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-xs font-bold text-red-500 md:mx-12";

export const MAIN_CLASS =
  "relative flex min-w-0 flex-1 flex-col overflow-hidden";

export const SCROLL_AREA_CLASS = "custom-scrollbar flex-1 overflow-y-auto";
export const CONTENT_CONTAINER_CLASS = "mx-auto max-w-5xl p-8 lg:p-12";

export const FALLBACK_CLASS =
  "flex h-screen items-center justify-center bg-cafe-bg";

export const SCROLLBAR_CSS = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(37, 99, 235, 0.3);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(37, 99, 235, 0.6);
  }
`;