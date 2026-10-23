import { memo } from "react";

import { motion } from "framer-motion";

import { Check, Plus } from "lucide-react";

interface AddToCartButtonProps {
  itemName: string;
  justAdded: boolean;
  onAdd: () => void;
}

export const AddToCartButton = memo(function AddToCartButton({
  itemName,
  justAdded,
  onAdd,
}: AddToCartButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(event) => {
        event.stopPropagation();
        onAdd();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      aria-label={
        justAdded ? `${itemName} added to cart` : `Add ${itemName} to cart`
      }
      className={`z-[60] scale-0 transform rounded-full p-2 shadow-lg transition-transform duration-300 focus-visible:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent group-hover:scale-100 ${
        justAdded
          ? "scale-100 bg-emerald-500 text-white"
          : "bg-zinc-100 text-black hover:bg-cafe-accent hover:text-white"
      }`}
    >
      {justAdded ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Plus size={16} aria-hidden="true" />
      )}
    </motion.button>
  );
});
