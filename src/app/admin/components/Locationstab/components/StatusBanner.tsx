import { memo } from "react";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { cx } from "../lib/cx";
import type { Banner } from "../types";

interface StatusBannerProps {
  banner: NonNullable<Banner>;
  onDismiss: () => void;
}

export const StatusBanner = memo(function StatusBanner({
  banner,
  onDismiss,
}: StatusBannerProps) {
  const isSuccess = banner.type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={cx(
        "flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold",
        isSuccess
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
          : "border-red-500/20 bg-red-500/5 text-red-400",
      )}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} aria-hidden="true" />
      ) : (
        <AlertCircle size={18} aria-hidden="true" />
      )}

      <span className="flex-1">{banner.message}</span>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="text-current opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
});
