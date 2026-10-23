import { memo } from "react";

import { LogIn } from "lucide-react";

export const SignInNotice = memo(function SignInNotice() {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-cafe-accent/30 bg-cafe-accent/5 px-5 py-4 text-zinc-700 dark:text-zinc-300"
    >
      <LogIn size={16} className="shrink-0 text-cafe-accent" aria-hidden="true" />

      <p className="text-xs font-bold">Please sign in to complete a booking.</p>
    </div>
  );
});
