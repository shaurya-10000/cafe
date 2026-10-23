import { memo } from "react";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cx } from "../lib/cx";
import type { Banner } from "../types";

interface StatusBannerProps {
  banner: NonNullable<Banner>;
}

export const StatusBanner = memo(function StatusBanner({ banner }: StatusBannerProps) {
  const isError = banner.type === "error";

  return (
    <div
      role="alert"
      className={cx(
        "flex items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-bold",
        isError
          ? "border-red-500/10 bg-red-500/5 text-red-500"
          : "border-emerald-500/10 bg-emerald-500/5 text-emerald-500",
      )}
    >
      {isError ? (
        <AlertCircle size={14} aria-hidden="true" />
      ) : (
        <CheckCircle2 size={14} aria-hidden="true" />
      )}

      {banner.message}
    </div>
  );
});
