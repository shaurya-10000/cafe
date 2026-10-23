import { useCallback, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import { getImageFadeMotion } from "../../lib/motion";
import type { StepDirection } from "../../types";
import { GalleryControls } from "./GalleryControls";

interface ProductGalleryProps {
  readonly name: string;
  readonly media: readonly string[];
  readonly reducedMotion: boolean;
}

/** Mounted with a per-item key, so the active image resets for each item. */
export function ProductGallery({
  name,
  media,
  reducedMotion,
}: ProductGalleryProps) {
  const [requestedIndex, setRequestedIndex] = useState(0);

  // Media can shrink while open (realtime edit); never index past the end.
  const activeIndex = requestedIndex < media.length ? requestedIndex : 0;
  const src = media[activeIndex];
  const hasGallery = media.length > 1;

  const step = useCallback(
    (direction: StepDirection) => {
      if (media.length === 0) return;
      setRequestedIndex((current) => {
        const base = current < media.length ? current : 0;
        return direction === "next"
          ? (base + 1) % media.length
          : (base - 1 + media.length) % media.length;
      });
    },
    [media.length],
  );

  return (
    <div className="relative aspect-square min-h-[280px] bg-zinc-100 dark:bg-zinc-900 md:aspect-auto md:h-full">
      {src ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            {...getImageFadeMotion(reducedMotion)}
            className="absolute inset-0"
          >
            <Image
              src={src}
              alt={
                hasGallery
                  ? `${name}, photo ${activeIndex + 1} of ${media.length}`
                  : name
              }
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
          <MessageSquareText size={32} strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}

      {hasGallery && (
        <GalleryControls
          count={media.length}
          activeIndex={activeIndex}
          onStep={step}
          onSelect={setRequestedIndex}
        />
      )}
    </div>
  );
}
