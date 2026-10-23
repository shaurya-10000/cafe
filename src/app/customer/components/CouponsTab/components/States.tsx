import { Tag } from "lucide-react";

import {
  EMPTY_PAGE_CLASS,
  EMPTY_TEXT_CLASS,
  LOADING_WRAPPER_CLASS,
  SPINNER_CLASS,
} from "../styles";

export function LoadingState() {
  return (
    <div className={LOADING_WRAPPER_CLASS}>
      <div aria-hidden="true" className={SPINNER_CLASS} />
      <span className="sr-only">Loading coupons…</span>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className={EMPTY_PAGE_CLASS}>
      <Tag
        size={40}
        className="mx-auto mb-4 text-gray-500/50"
        strokeWidth={1}
        aria-hidden="true"
      />
      <p className={EMPTY_TEXT_CLASS}>No coupons available right now</p>
    </div>
  );
}