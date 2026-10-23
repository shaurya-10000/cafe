import { memo } from "react";

import { motion } from "framer-motion";

import { Clock, ShieldCheck } from "lucide-react";

import { COPY } from "../constants";
import { itemVariants } from "../motion";

interface BookingIntroProps {
  motionEnabled: boolean;
}

export const BookingIntro = memo(function BookingIntro({
  motionEnabled,
}: BookingIntroProps) {
  const variants = motionEnabled ? itemVariants : undefined;

  return (
    <div className="space-y-12 lg:col-span-5">
      <motion.div variants={variants} className="space-y-6">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cafe-accent">
          Table Service
        </p>

        <h2 className="text-6xl font-black uppercase leading-[0.8] tracking-tighter text-zinc-900 dark:text-zinc-100 md:text-8xl">
          Book
          <br />
          <span className="font-serif lowercase italic text-cafe-accent">
            Your
          </span>{" "}
          <br />
          Ritual.
        </h2>

        <p className="max-w-sm pt-4 text-lg font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
          {COPY.subheading}
        </p>
      </motion.div>

      <motion.div
        variants={variants}
        className="grid grid-cols-1 gap-8 border-t border-[#EAE9E4] pt-8 dark:border-zinc-900 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <ShieldCheck
              size={16}
              className="text-cafe-accent"
              aria-hidden="true"
            />

            <span className="text-[10px] font-black uppercase tracking-widest">
              Instant Request
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase leading-relaxed tracking-widest text-zinc-500">
            Confirmation sent to your inbox.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Clock size={16} className="text-cafe-accent" aria-hidden="true" />

            <span className="text-[10px] font-black uppercase tracking-widest">
              Grace Period
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase leading-relaxed tracking-widest text-zinc-500">
            Tables held for 15 minutes.
          </p>
        </div>
      </motion.div>
    </div>
  );
});
