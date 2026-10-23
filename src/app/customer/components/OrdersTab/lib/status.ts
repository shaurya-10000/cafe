import { CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";

import { STATUS_STEPS } from "../constants";
import type { StatusStyle } from "../types";

export function getStatusIndex(status: string): number {
  return STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
}

export function getProgressWidth(status: string): string {
  const index = getStatusIndex(status);
  if (index === -1) return "0%";
  return `${(index / (STATUS_STEPS.length - 1)) * 100}%`;
}

/**
 * Icon + wrapper classes for an order status. The icon is decorative: the
 * adjacent status badge conveys the same information in text.
 */
export function getStatusStyle(status: string): StatusStyle {
  switch (status) {
    case "completed":
      return {
        Icon: CheckCircle2,
        wrapperClass: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
      };
    case "refunded":
      return {
        Icon: RotateCcw,
        wrapperClass: "border-amber-500/20 bg-amber-500/5 text-amber-500",
      };
    case "declined":
      return {
        Icon: XCircle,
        wrapperClass: "border-red-500/20 bg-red-500/5 text-red-500",
      };
    case "ready":
      return {
        Icon: Clock,
        wrapperClass:
          "bg-green-500/10 border-green-500/20 text-green-500 animate-pulse",
      };
    default:
      return {
        Icon: Clock,
        wrapperClass: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      };
  }
}