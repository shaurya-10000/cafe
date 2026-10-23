import { memo } from "react";

import { Loader2 } from "lucide-react";

interface LoadErrorBannerProps {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}

export const LoadErrorBanner = memo(function LoadErrorBanner({
  message,
  isRetrying,
  onRetry,
}: LoadErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-3 rounded-2xl border border-red-500/10 bg-red-500/5 py-4 text-center text-sm font-bold text-red-500"
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-1.5 underline underline-offset-2 transition-colors hover:text-red-600 disabled:opacity-60"
      >
        {isRetrying && (
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        )}
        Retry
      </button>
    </div>
  );
});
