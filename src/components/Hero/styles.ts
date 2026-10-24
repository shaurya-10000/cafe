import { cn } from "@/lib/utils";

export const FOCUS_RING = cn(
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-cafe-accent",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-cafe-bg",
);

/* Layout ------------------------------------------------------------------- */

export const SECTION = cn(
  "relative flex h-[100svh] w-full items-center justify-center",
  "overflow-hidden bg-cafe-bg",
  "selection:bg-cafe-accent selection:text-cafe-accent-fg",
);

export const CONTENT = "relative z-10 w-full max-w-6xl px-8";
export const CONTENT_STACK = "flex flex-col items-center text-center";

export const BOTTOM_FADE = cn(
  "pointer-events-none absolute bottom-0 left-0",
  "h-48 w-full",
  "bg-gradient-to-t from-cafe-bg via-transparent to-transparent",
);

/* Background --------------------------------------------------------------- */

export const BACKGROUND = "absolute inset-0 z-0";
export const BACKGROUND_IMAGE =
  "object-cover object-center opacity-40 dark:opacity-30";
export const BACKGROUND_WASH = "absolute inset-0 bg-black/50 dark:bg-black/70";
export const BACKGROUND_FADE =
  "absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cafe-bg";

/* Typography --------------------------------------------------------------- */

export const EYEBROW = "mb-12 flex items-center gap-3";
export const EYEBROW_RULE = "h-px w-8 bg-cafe-fg/20";
export const EYEBROW_TEXT =
  "text-[9px] font-medium uppercase tracking-[0.8em] text-cafe-fg/50";

export const HEADING = cn(
  "mb-12 select-none",
  "text-[clamp(4rem,14vw,12rem)]",
  "font-extralight uppercase",
  "leading-[0.85] tracking-[-0.06em]",
  "text-cafe-fg",
);
export const HEADING_DOT = "italic text-cafe-accent";

export const SUBTITLE = "mb-20 max-w-md";
export const SUBTITLE_TEXT =
  "text-lg font-extralight italic leading-relaxed tracking-tight text-cafe-fg/70 md:text-xl";
export const SUBTITLE_RULE = "mx-auto mt-6 block h-px w-8 bg-cafe-fg/10";

/* Actions ------------------------------------------------------------------ */

export const ACTIONS =
  "flex w-full flex-col items-center justify-center gap-4 sm:flex-row";

export const BUTTON_SIZE = "h-16 w-full rounded-full sm:w-60";
export const BUTTON_LABEL =
  "text-[10px] font-bold uppercase leading-none tracking-[0.25em]";

export interface SlideButtonStyle {
  readonly root: string;
  readonly label: string;
  readonly fill: string;
  readonly overlayLabel: string;
}

/**
 * Buttons with a sliding fill. On hover the fill covers the base and a
 * duplicate overlay label switches colour so it stays legible against the
 * new background.
 */
export const SLIDE_BUTTONS: Record<"primary" | "accent", SlideButtonStyle> = {
  primary: {
    root: cn(
      "bg-cafe-fg text-cafe-bg shadow-xl",
      "transition-[background-color,box-shadow] duration-500",
      "motion-reduce:transition-none",
    ),
    label: "text-cafe-bg",
    fill: "bg-cafe-accent",
    overlayLabel: "text-cafe-accent-fg",
  },
  accent: {
    root: cn(
      "border border-cafe-accent bg-cafe-accent",
      "text-cafe-accent-fg",
      "shadow-lg shadow-cafe-accent/25",
      "transition-[box-shadow] duration-500",
      "hover:shadow-cafe-accent/40",
      "motion-reduce:transition-none",
    ),
    label: cn(
      "transition-colors duration-500",
      "group-hover:text-cafe-accent",
      "motion-reduce:transition-none",
    ),
    fill: "bg-cafe-bg",
    overlayLabel: "text-cafe-accent",
  },
};

export const SLIDE_BUTTON_BASE =
  "group relative inline-flex items-center justify-center overflow-hidden";

export const SLIDE_FILL = cn(
  "translate-y-full group-hover:translate-y-0",
  "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
  "motion-reduce:transition-none motion-reduce:translate-y-0",
);

export const SLIDE_OVERLAY_LABEL = cn(
  "pointer-events-none absolute inset-0 z-[5]",
  "flex items-center justify-center",
  "opacity-0",
  "transition-opacity duration-500",
  "group-hover:opacity-100",
  "motion-reduce:transition-none",
);

export const SECONDARY_BUTTON = cn(
  "inline-flex items-center justify-center border border-cafe-border",
  "text-cafe-fg/80",
  "backdrop-blur-md",
  "transition-[color,border-color,background-color] duration-500",
  "hover:border-cafe-fg/30 hover:text-cafe-fg",
  "motion-reduce:transition-none",
);

/* Version stamp ------------------------------------------------------------ */

export const STAMP_WRAPPER =
  "absolute bottom-12 left-12 hidden overflow-hidden lg:block";
export const STAMP = cn(
  "origin-left -rotate-90",
  "text-[9px] font-bold uppercase tracking-[0.5em]",
  "text-cafe-fg/30",
);