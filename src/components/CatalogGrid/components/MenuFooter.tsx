import { memo } from "react";

import Link from "next/link";

import { motion } from "framer-motion";

import { Download, FileText } from "lucide-react";

import {
  FULL_MENU_PATH,
  MENU_PDF_FILENAME,
  MENU_PDF_HREF,
  MENU_PDF_SIZE_LABEL,
} from "../constants";
import { itemVariants } from "../variants";

export const MenuFooter = memo(function MenuFooter() {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false }}
      className="flex flex-col items-center justify-center gap-8 border-t border-[#EAE9E4] pt-12 sm:flex-row dark:border-zinc-900"
    >
      <Link
        href={FULL_MENU_PATH}
        className="border-b-2 border-transparent pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-cafe-accent hover:text-cafe-accent"
      >
        View Full Menu
      </Link>

      <a
        href={MENU_PDF_HREF}
        download={MENU_PDF_FILENAME}
        className="group flex items-center gap-4 rounded-full bg-[#F5F5F1] px-8 py-4 shadow-sm transition-all duration-500 hover:bg-cafe-accent hover:shadow-xl hover:shadow-cafe-accent/20 dark:bg-zinc-900 dark:hover:bg-cafe-accent"
      >
        <div className="rounded-full bg-white p-2 transition-colors group-hover:bg-white dark:bg-zinc-800">
          <FileText size={14} className="text-cafe-accent" aria-hidden="true" />
        </div>

        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 transition-colors group-hover:text-white dark:text-zinc-100">
            Download PDF
          </span>

          <span className="mt-1 text-[8px] font-bold uppercase text-zinc-400 transition-colors group-hover:text-white/70">
            Offline Access &bull; {MENU_PDF_SIZE_LABEL}
          </span>
        </div>

        <Download
          size={16}
          aria-hidden="true"
          className="ml-2 text-zinc-400 transition-colors group-hover:text-white"
        />
      </a>
    </motion.div>
  );
});
