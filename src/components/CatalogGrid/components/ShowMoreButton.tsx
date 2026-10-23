import { memo } from "react";

import { motion } from "framer-motion";

import { ChevronDown } from "lucide-react";

import { itemVariants } from "../variants";

interface ShowMoreButtonProps {
  onClick: () => void;
}

export const ShowMoreButton = memo(function ShowMoreButton({
  onClick,
}: ShowMoreButtonProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="flex justify-center pt-12"
    >
      <motion.button
        type="button"
        onClick={onClick}
        className="group flex items-center gap-4 rounded-full bg-zinc-900 px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-cafe-accent/10 transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:bg-zinc-100 dark:text-black"
      >
        Show More
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="transition-transform group-hover:translate-y-1"
        />
      </motion.button>
    </motion.div>
  );
});
