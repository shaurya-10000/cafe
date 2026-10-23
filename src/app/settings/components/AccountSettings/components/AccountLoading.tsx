import { Loader2 } from "lucide-react";

export function AccountLoading() {
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center">
      <Loader2
        className="animate-spin text-cafe-accent"
        size={28}
        aria-hidden="true"
      />
      <span className="sr-only">Loading account settings&hellip;</span>
    </div>
  );
}
