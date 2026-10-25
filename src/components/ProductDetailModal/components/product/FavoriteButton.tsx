import { Heart, Loader2 } from "lucide-react";
import { cx } from "../../lib/cx";
import { FOCUS_RING } from "../../styles";

interface FavoriteButtonProps {
  readonly itemName: string;
  readonly isFavorited: boolean;
  readonly isPending: boolean;
  readonly onToggle: () => void;
}

export function FavoriteButton({
  itemName,
  isFavorited,
  isPending,
  onToggle,
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-label={
        isFavorited
          ? `Remove ${itemName} from favorites`
          : `Add ${itemName} to favorites`
      }
      aria-pressed={isFavorited}
      className={cx(
        "shrink-0 rounded-full border border-zinc-200 bg-zinc-100 p-3 transition-colors disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900",
        FOCUS_RING,
      )}
    >
      {isPending ? (
        <Loader2
          size={18}
          className="animate-spin text-zinc-400"
          aria-hidden="true"
        />
      ) : (
        <Heart
          size={18}
          aria-hidden="true"
          className={
            isFavorited ? "fill-cafe-favorite text-cafe-favorite" : "text-zinc-400"
          }
        />
      )}
    </button>
  );
}
