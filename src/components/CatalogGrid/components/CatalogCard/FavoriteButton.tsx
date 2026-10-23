import { memo } from "react";

import { motion } from "framer-motion";

import { Heart, Loader2 } from "lucide-react";

interface FavoriteButtonProps {
  itemName: string;
  isFavorited: boolean;
  isPending: boolean;
  onToggle: () => void;
}

export const FavoriteButton = memo(function FavoriteButton({
  itemName,
  isFavorited,
  isPending,
  onToggle,
}: FavoriteButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.8 }}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      aria-label={
        isFavorited
          ? `Remove ${itemName} from favorites`
          : `Add ${itemName} to favorites`
      }
      aria-pressed={isFavorited}
      disabled={isPending}
      className="z-[60] rounded-full border border-[#EAE9E4] bg-white/90 p-2 shadow-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/90"
    >
      {isPending ? (
        <Loader2
          size={14}
          className="animate-spin text-zinc-400"
          aria-hidden="true"
        />
      ) : (
        <Heart
          size={14}
          aria-hidden="true"
          className={
            isFavorited ? "fill-red-500 text-red-500" : "text-zinc-400"
          }
        />
      )}
    </motion.button>
  );
});
