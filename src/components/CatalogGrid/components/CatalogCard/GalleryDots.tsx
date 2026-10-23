import { memo } from "react";

interface GalleryDotsProps {
  count: number;
  activeIndex: number;
}

export const GalleryDots = memo(function GalleryDots({
  count,
  activeIndex,
}: GalleryDotsProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`h-1 rounded-full transition-all duration-300 ${
            activeIndex === index ? "w-4 bg-cafe-accent" : "w-1 bg-white/40"
          }`}
        />
      ))}
    </div>
  );
});
