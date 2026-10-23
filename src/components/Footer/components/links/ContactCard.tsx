import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isHashAnchor } from "../../lib/links";
import { FOCUS_RING } from "../../styles";
import type { FooterContactItem } from "../../types";

interface ContactCardProps {
  readonly item: FooterContactItem;
  readonly reducedMotion: boolean;
}

const CARD_CLASSES = cn(
  "group block rounded-2xl p-4",
  "transition-colors duration-200",
  "hover:bg-cafe-fg/[0.04]",
  "dark:hover:bg-cafe-fg/[0.06]",
  "focus-visible:bg-cafe-fg/[0.04]",
  "dark:focus-visible:bg-cafe-fg/[0.06]",
  "motion-reduce:transition-none",
  FOCUS_RING,
);

const ICON_CLASSES = cn(
  "mb-3 inline-flex size-9 items-center justify-center",
  "rounded-full bg-cafe-fg/[0.06]",
  "text-cafe-fg/70",
  "dark:bg-cafe-fg/10 dark:text-cafe-fg/80",
);

export const ContactCard = memo(function ContactCard({
  item,
  reducedMotion,
}: ContactCardProps) {
  const content = (
    <>
      <span aria-hidden="true" className={ICON_CLASSES}>
        {item.icon}
      </span>

      <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-cafe-fg/40">
        {item.label}
      </span>

      <span className="mt-1 block text-sm leading-5 text-cafe-fg/80">
        {item.value}
      </span>
    </>
  );

  const motionProps = {
    whileHover: reducedMotion ? undefined : { y: -2 },
    transition: { duration: 0.2 },
  } as const;

  if (item.external) {
    return (
      <motion.a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={CARD_CLASSES}
        {...motionProps}
      >
        {content}
      </motion.a>
    );
  }

  if (isHashAnchor(item.href)) {
    return (
      <motion.a href={item.href} className={CARD_CLASSES} {...motionProps}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div className="block" {...motionProps}>
      <Link href={item.href} className={CARD_CLASSES}>
        {content}
      </Link>
    </motion.div>
  );
});
