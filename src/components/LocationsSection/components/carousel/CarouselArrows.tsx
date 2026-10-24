import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "../../lib/cx";
import { FOCUS_RING_CLASSES } from "../../styles";
import type { SlideDirection } from "../../types";

interface CarouselArrowsProps {
  onStep: (direction: SlideDirection) => void;
}

const ARROW_CLASSES =
  "absolute top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#EAE9E4] bg-white/90 text-zinc-900 shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:border-cafe-accent hover:text-cafe-accent dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100";

export function CarouselArrows({ onStep }: CarouselArrowsProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onStep("prev")}
        aria-label="Previous location"
        className={cx(ARROW_CLASSES, "-left-16", FOCUS_RING_CLASSES)}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onStep("next")}
        aria-label="Next location"
        className={cx(ARROW_CLASSES, "-right-16", FOCUS_RING_CLASSES)}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </>
  );
}
