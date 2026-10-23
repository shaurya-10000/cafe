import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";

import { motion } from "framer-motion";

import { Star } from "lucide-react";

import type { CatalogItem } from "@/types/catalog";

import { normalizeMedia } from "../../lib/catalog";
import type { GalleryDirection } from "../../types";
import { cardExit, itemVariants } from "../../variants";
import { AddToCartButton } from "./AddToCartButton";
import { CardMedia } from "./CardMedia";
import { FavoriteButton } from "./FavoriteButton";
import { GalleryArrows } from "./GalleryArrows";
import { GalleryDots } from "./GalleryDots";

export interface CatalogCardProps {
  item: CatalogItem;
  imageIndex: number;
  priceLabel: string;
  isFavorited: boolean;
  isFavoritePending: boolean;
  isHighlighted: boolean;
  justAdded: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onAddToCart: (item: CatalogItem) => void;
  onImageNav: (
    itemId: string,
    direction: GalleryDirection,
    total: number,
  ) => void;
}

/**
 * Must forward its ref: AnimatePresence(mode="popLayout") measures the
 * outgoing child through the ref it injects.
 */
export const CatalogCard = memo(
  forwardRef<HTMLDivElement, CatalogCardProps>(function CatalogCard(
    {
      item,
      imageIndex,
      priceLabel,
      isFavorited,
      isFavoritePending,
      isHighlighted,
      justAdded,
      onOpen,
      onToggleFavorite,
      onAddToCart,
      onImageNav,
    },
    ref,
  ) {
    const media = useMemo(() => normalizeMedia(item.media), [item.media]);

    const mediaLength = media.length;
    const activeIndex = mediaLength > 0 ? imageIndex % mediaLength : 0;
    const hasMultipleImages = mediaLength > 1;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.target !== event.currentTarget) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen(item.id);
      }
    };

    const handleSwipe = useCallback(
      (direction: GalleryDirection) => {
        onImageNav(item.id, direction, mediaLength);
      },
      [item.id, mediaLength, onImageNav],
    );

    return (
      <motion.div
        ref={ref}
        data-item-id={item.id}
        layout
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit={cardExit}
        whileHover={{ y: -8 }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${item.name}, ${priceLabel}`}
        onKeyDown={handleKeyDown}
        onClick={() => onOpen(item.id)}
        className={`group relative flex h-[280px] cursor-pointer flex-col justify-between overflow-hidden rounded-[2.5rem] border bg-[#FAF9F6] p-8 transition-shadow hover:shadow-2xl hover:shadow-cafe-accent/5 focus:outline-none focus:ring-2 focus:ring-cafe-accent dark:bg-zinc-900 ${
          isHighlighted
            ? "border-cafe-accent ring-2 ring-cafe-accent ring-offset-2 ring-offset-[#FAF9F6] dark:ring-offset-black"
            : "border-[#EAE9E4] dark:border-zinc-800"
        }`}
      >
        <CardMedia
          itemId={item.id}
          name={item.name}
          src={media[activeIndex]}
          imageIndex={activeIndex}
          onSwipe={handleSwipe}
        />

        {hasMultipleImages && <GalleryArrows onNavigate={handleSwipe} />}

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="w-fit rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200 backdrop-blur-md">
              {item.category}
            </span>

            {item.rating != null && (
              <div className="flex w-fit items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-cafe-accent backdrop-blur-md">
                <Star size={10} fill="currentColor" aria-hidden="true" />
                <span className="text-[10px] font-black">{item.rating}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <FavoriteButton
              itemName={item.name}
              isFavorited={isFavorited}
              isPending={isFavoritePending}
              onToggle={() => void onToggleFavorite(item.id)}
            />

            <span className="text-lg font-black italic text-white drop-shadow-lg">
              {priceLabel}
            </span>

            <AddToCartButton
              itemName={item.name}
              justAdded={justAdded}
              onAdd={() => onAddToCart(item)}
            />
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          <h3 className="max-w-[180px] text-3xl font-black uppercase leading-none tracking-tighter text-white drop-shadow-2xl">
            {item.name}
          </h3>

          <div className="h-[3px] w-8 bg-cafe-accent shadow-sm transition-all duration-500 ease-out group-hover:w-full" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {hasMultipleImages && (
          <GalleryDots count={mediaLength} activeIndex={activeIndex} />
        )}
      </motion.div>
    );
  }),
);
