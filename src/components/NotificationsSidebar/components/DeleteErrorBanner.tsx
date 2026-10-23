import { X } from "lucide-react";

interface DeleteErrorBannerProps {
  readonly message: string;
  readonly onDismiss: () => void;
}

export function DeleteErrorBanner({
  message,
  onDismiss,
}: DeleteErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[11px] font-bold text-red-600 dark:text-red-400"
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
