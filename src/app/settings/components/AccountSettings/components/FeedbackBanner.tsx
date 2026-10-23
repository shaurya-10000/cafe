import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBannerMotion } from "../lib/motion";
import type { Banner } from "../types";

interface FeedbackBannerProps {
  readonly banner: Banner | null;
  readonly onDismiss: () => void;
  readonly reducedMotion: boolean;
}

export function FeedbackBanner({
  banner,
  onDismiss,
  reducedMotion,
}: FeedbackBannerProps) {
  return (
    <AnimatePresence initial={false}>
      {banner && (
        <motion.div
          {...getBannerMotion(reducedMotion)}
          role={banner.type === "error" ? "alert" : "status"}
          aria-live={banner.type === "error" ? "assertive" : "polite"}
          className={cn(
            "flex items-center gap-3 overflow-hidden rounded-2xl border px-5 py-4 text-sm font-semibold",
            banner.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
              : "border-red-500/20 bg-red-500/5 text-red-400",
          )}
        >
          {banner.type === "success" ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span className="flex-1">{banner.message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="text-current opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
