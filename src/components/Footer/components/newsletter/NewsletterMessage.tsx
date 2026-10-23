import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFadeSlideMotion } from "../../lib/motion";

interface NewsletterMessageProps {
  readonly id: string;
  readonly message: string;
  readonly isError: boolean;
  readonly reducedMotion: boolean;
}

export function NewsletterMessage({
  id,
  message,
  isError,
  reducedMotion,
}: NewsletterMessageProps) {
  return (
    <motion.p
      id={id}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      {...getFadeSlideMotion(reducedMotion, -4)}
      className={cn(
        "mt-3 flex items-start gap-2",
        "text-xs leading-5",
        isError ? "text-red-600 dark:text-red-400" : "text-cafe-fg/70",
      )}
    >
      <AlertCircle aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </motion.p>
  );
}
