import { Plus } from "lucide-react";
import { cx } from "../../lib/cx";
import { FOCUS_RING } from "../../styles";

interface AddToCartButtonProps {
  readonly quantity: number;
  readonly onClick: () => void;
}

export function AddToCartButton({ quantity, onClick }: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full items-center justify-center gap-3 rounded-full bg-zinc-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 dark:bg-zinc-100 dark:text-black",
        FOCUS_RING,
      )}
    >
      <Plus size={16} aria-hidden="true" />
      Add {quantity > 1 ? `${quantity} ` : ""}to Cart
    </button>
  );
}
