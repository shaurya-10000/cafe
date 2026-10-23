import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getHeaderVariants } from "../lib/motion";
import { ConciergePillButton } from "./ConciergeButtons";

interface FaqHeaderProps {
  readonly headingId: string;
  readonly isAiOpen: boolean;
  readonly onOpenAi: () => void;
  readonly reducedMotion: boolean;
}

export function FaqHeader({
  headingId,
  isAiOpen,
  onOpenAi,
  reducedMotion,
}: FaqHeaderProps) {
  const variants = useMemo(
    () => getHeaderVariants(reducedMotion),
    [reducedMotion],
  );

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
      className={cn(
        "mb-16 flex flex-col justify-between gap-10",
        "md:flex-row md:items-end",
      )}
    >
      <div className="space-y-5">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cafe-accent">
          Common Questions
        </p>

        <h2
          id={headingId}
          className={cn(
            "text-6xl font-black uppercase",
            "leading-[0.8] tracking-tighter",
            "text-cafe-fg md:text-8xl",
          )}
        >
          Before{" "}
          <span className="font-serif lowercase italic text-cafe-accent">
            you
          </span>{" "}
          <br />
          arrive.
        </h2>
      </div>

      <div className="max-w-sm space-y-5">
        <p className="text-sm font-medium leading-relaxed text-cafe-fg/60">
          Answers to the things guests ask us most &mdash; from booking windows
          and dietary flags to where to park once you get here.
        </p>

        <ConciergePillButton isOpen={isAiOpen} onOpen={onOpenAi} />
      </div>
    </motion.div>
  );
}
