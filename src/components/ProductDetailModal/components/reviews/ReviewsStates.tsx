import { AlertCircle, Loader2 } from "lucide-react";

export function ReviewsLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2
        className="animate-spin text-zinc-400"
        size={20}
        aria-hidden="true"
      />
    </div>
  );
}

export function ReviewsError({ message }: { readonly message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-xs font-bold text-red-500">
      <AlertCircle size={14} aria-hidden="true" />
      {message}
    </div>
  );
}

export function ReviewsEmpty() {
  return (
    <p className="py-2 text-xs font-medium text-zinc-500">
      No reviews yet &mdash; be the first to try this one.
    </p>
  );
}
