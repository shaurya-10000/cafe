import { Heart, Loader2 } from "lucide-react";

import {
  EMPTY_CLASS,
  EMPTY_TEXT_CLASS,
  LOADING_WRAPPER_CLASS,
} from "../styles";

export function LoadingState() {
  return (
    <div className={LOADING_WRAPPER_CLASS}>
      <Loader2
        className="animate-spin text-cafe-accent"
        size={40}
        aria-hidden="true"
      />
      <span className="sr-only">Loading favorites…</span>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className={EMPTY_CLASS}>
      <Heart
        size={48}
        className="mx-auto mb-4 text-gray-500/50"
        strokeWidth={1}
        aria-hidden="true"
      />
      <p className={EMPTY_TEXT_CLASS}>No favorites found</p>
    </div>
  );
}