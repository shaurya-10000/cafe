import { CheckCircle2, Clock, XCircle } from "lucide-react";

import type { StatusIconKind } from "../types";

/**
 * Purely decorative: the adjacent status badge and the progress bar carry
 * the same information in text and shape.
 */
export function BookingStatusIcon({ kind }: { kind: StatusIconKind }) {
  if (kind === "check") return <CheckCircle2 size={24} aria-hidden="true" />;
  if (kind === "x") return <XCircle size={24} aria-hidden="true" />;
  return <Clock size={24} aria-hidden="true" />;
}