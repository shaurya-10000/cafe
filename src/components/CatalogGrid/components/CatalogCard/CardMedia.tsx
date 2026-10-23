import { memo } from "react";

import Image from "next/image";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";

import { ImageOff } from "lucide-react";

import { IMAGE_DRAG_THRESHOLD_PX } from "../../constants";
import type { GalleryDirection } from "../../types";

interface CardMediaProps {
  itemId: string;
  name: string;
  src: string | undefined;
  imageIndex: number;
  onSwipe: (direction: GalleryDirection) => void;
}

export const CardMedia = memo(function CardMedia({
  itemId,
  name,
  src,
  imageIndex,
  onSwipe,
}: CardMediaProps) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-cafe-accent/70 via-zinc-800 to-zinc-950">
        <ImageOff
          size={28}
          strokeWidth={1.5}
          className="text-white/25"
          aria-hidden="true"
        />
      </div>
    );
  }

  const handleDragEnd = (_event: unknown, info: PanInfo): void => {
    if (info.offset.x < -IMAGE_DRAG_THRESHOLD_PX) onSwipe("next");
    if (info.offset.x > IMAGE_DRAG_THRESHOLD_PX) onSwipe("prev");
  };

  return (
    <div className="absolute inset-0 h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${itemId}-${imageIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="relative h-full w-full"
        >
          <Image
            src={src}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </motion.div>
      </AnimatePresence>

      {/* Mobile swipe surface. */}
      <motion.div
        className="absolute inset-0 z-20 md:hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragDirectionLock
        style={{ touchAction: "pan-y" }}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
});
