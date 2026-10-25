import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import {
  MESSAGE_CLASS,
  NOT_RATABLE_CLASS,
  SUCCESS_ICON_CLASS,
  SUCCESS_TEXT_CLASS,
  SUCCESS_WRAPPER_CLASS,
} from "../styles";

export function LoadingPanel() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2
        className="animate-spin text-cafe-accent"
        size={28}
        aria-hidden="true"
      />
      <span className="sr-only">Loading order…</span>
    </div>
  );
}

export function NotFoundPanel() {
  return <p className={MESSAGE_CLASS}>Order not found.</p>;
}

export function NotRatablePanel({ reason }: { reason: string }) {
  return (
    <div role="alert" className={NOT_RATABLE_CLASS}>
      <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
      <p className="text-xs font-bold">{reason}</p>
    </div>
  );
}

export function AllReviewedPanel() {
  return (
    <p className={MESSAGE_CLASS}>
      You&apos;ve already rated every item in this order. Thank you!
    </p>
  );
}

export function SuccessPanel() {
  return (
    <div role="status" aria-live="polite" className={SUCCESS_WRAPPER_CLASS}>
      <div aria-hidden="true" className={SUCCESS_ICON_CLASS}>
        <CheckCircle2 size={28} />
      </div>
      <p className={SUCCESS_TEXT_CLASS}>Thanks for the feedback!</p>
    </div>
  );
}