import { memo } from "react";

import Link from "next/link";

import { User } from "lucide-react";

import { SIGN_IN_PATH } from "../constants";
import { cn } from "../lib/cn";
import { FOCUS_RING, MIN_TOUCH_TARGET } from "../styles";

export const SignInLink = memo(function SignInLink() {
  return (
    <Link
      href={SIGN_IN_PATH}
      className={cn(
        "flex items-center gap-2 sm:gap-3",
        "rounded-2xl bg-cafe-fg",
        "px-3 py-3 sm:px-6",
        "text-[11px] font-black uppercase tracking-widest",
        "text-cafe-bg shadow-xl",
        "transition-transform duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        MIN_TOUCH_TARGET,
        FOCUS_RING,
      )}
    >
      <User size={16} strokeWidth={2.5} aria-hidden="true" />

      <span className="hidden md:block">Sign In</span>
    </Link>
  );
});
