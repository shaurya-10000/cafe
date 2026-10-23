import { memo, type MouseEvent } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { GalleryDirection } from "../../types";

interface GalleryArrowsProps {
  onNavigate: (direction: GalleryDirection) => void;
}

const ARROW_CLASS_NAME =
  "rounded-full bg-white/90 p-1.5 text-zinc-900 opacity-0 shadow-xl backdrop-blur-md transition-transform hover:scale-110 group-hover:opacity-100 dark:bg-black/90 dark:text-white";

export const GalleryArrows = memo(function GalleryArrows({
  onNavigate,
}: GalleryArrowsProps) {
  const handle =
    (direction: GalleryDirection) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onNavigate(direction);
    };

  return (
    <div className="absolute inset-x-4 top-1/2 z-50 hidden -translate-y-1/2 items-center justify-between md:flex">
      <button
        type="button"
        onClick={handle("prev")}
        aria-label="Previous image"
        className={ARROW_CLASS_NAME}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={handle("next")}
        aria-label="Next image"
        className={ARROW_CLASS_NAME}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
});
