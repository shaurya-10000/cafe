import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFadeSlideMotion } from "../../lib/motion";

interface NewsletterSuccessProps {
  readonly title: string;
  readonly body: string;
  readonly reducedMotion: boolean;
}

export function NewsletterSuccess({
  title,
  body,
  reducedMotion,
}: NewsletterSuccessProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation so screen-reader and keyboard users land
  // on it once the form it replaces has unmounted.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      titleRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      {...getFadeSlideMotion(reducedMotion)}
      className={cn(
        "flex items-start gap-3 rounded-2xl",
        "border border-cafe-border",
        "bg-cafe-fg/[0.03] p-4",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center",
          "rounded-full bg-emerald-500/15",
          "text-emerald-600 dark:text-emerald-400",
        )}
      >
        <Check size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <h3
          ref={titleRef}
          tabIndex={-1}
          className="text-sm font-semibold text-cafe-fg outline-none"
        >
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-cafe-fg/60">{body}</p>
      </div>
    </motion.div>
  );
}
