import { memo } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { Heart, Plus } from "lucide-react";

import { cx } from "../lib/cx";
import { FOCUS_RING } from "../styles";
import type { FavoriteDisplayItem } from "../types";

interface FavoritesQuickAddProps {
  items: readonly FavoriteDisplayItem[];
  onAdd: (item: FavoriteDisplayItem) => void;
}

export const FavoritesQuickAdd = memo(function FavoritesQuickAdd({
  items,
  onAdd,
}: FavoritesQuickAddProps) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="z-20 shrink-0 border-t border-[#EAE9E4] bg-[#FAF9F6] px-6 py-4 dark:border-white/5 dark:bg-black">
      <div className="mb-3 flex items-center gap-2">
        <Heart
          size={12}
          className="fill-cafe-favorite text-cafe-favorite"
          aria-hidden="true"
        />

        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
          Quick Add Favorites
        </span>
      </div>

      <div className="sidebar-scroll flex gap-3 overflow-x-auto scroll-smooth pb-2">
        {items.map((favorite) => (
          <motion.button
            key={favorite.id}
            type="button"
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            onClick={() => onAdd(favorite)}
            className={cx(
              "flex flex-shrink-0 items-center gap-3 rounded-xl border border-[#EAE9E4] bg-white p-2 pr-4 shadow-sm transition-colors hover:border-[#C5A059] dark:border-white/5 dark:bg-zinc-900/80",
              FOCUS_RING,
            )}
          >
            <div className="rounded-lg bg-[#FAF9F6] p-1.5 text-[#C5A059] dark:bg-white/5">
              <Plus size={12} aria-hidden="true" />
            </div>

            <div className="text-left leading-tight">
              <p className="w-24 truncate text-[10px] font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                {favorite.name}
              </p>

              <p className="text-[9px] font-bold text-zinc-400">
                {favorite.priceLabel}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
});
