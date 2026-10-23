import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "../../lib/cx";
import { FOCUS_RING_CLASSES } from "../../styles";
import type { SlideDirection } from "../../types";

interface CarouselArrowsProps {
  onStep: (direction: SlideDirection) => void;
}

const ARROW_CLASSES =
  "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#EAE9E4] bg-white text-zinc-500 shadow-lg transition-all hover:border-cafe-accent hover:text-cafe-accent dark:border-zinc-800 dark:bg-zinc-900 md:flex";

export function CarouselArrows({ onStep }: CarouselArrowsProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onStep("prev")}
        aria-label="Previous location"
        className={cx(ARROW_CLASSES, "-left-6", FOCUS_RING_CLASSES)}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onStep("next")}
        aria-label="Next location"
        className={cx(ARROW_CLASSES, "-right-6", FOCUS_RING_CLASSES)}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </>
  );
}
