import { memo } from "react";

import Link from "next/link";

import { LayoutDashboard } from "lucide-react";

import { cn } from "../lib/cn";
import { getDashboardLabel, getDashboardPath } from "../lib/routing";
import { FOCUS_RING, ICON_BUTTON_BASE, MIN_TOUCH_TARGET } from "../styles";
import type { AccessState } from "../types";

interface DashboardLinkProps {
  access: AccessState;
  isDashboard: boolean;
}

export const DashboardLink = memo(function DashboardLink({
  access,
  isDashboard,
}: DashboardLinkProps) {
  const { isAdmin, isLoading, isError } = access;

  if (isLoading || isError) {
    const label = isError ? "Unable to verify access" : "Loading access";

    return (
      <span
        role="status"
        aria-busy="true"
        aria-label={label}
        title={label}
        className={cn(
          ICON_BUTTON_BASE,
          MIN_TOUCH_TARGET,
          "flex cursor-progress items-center justify-center",
          "p-3 opacity-40",
        )}
      >
        <LayoutDashboard size={20} strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }

  const label = getDashboardLabel(isAdmin);

  return (
    <Link
      href={getDashboardPath(isAdmin)}
      aria-label={label}
      aria-current={isDashboard ? "page" : undefined}
      title={label}
      className={cn(ICON_BUTTON_BASE, MIN_TOUCH_TARGET, "p-3", FOCUS_RING)}
    >
      <LayoutDashboard size={20} strokeWidth={2.5} aria-hidden="true" />
    </Link>
  );
});
