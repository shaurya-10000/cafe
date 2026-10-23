import { Loader2 } from "lucide-react";

export function SettingsLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-cafe-bg">
      <Loader2
        className="animate-spin text-cafe-accent"
        size={32}
        aria-hidden="true"
      />
      <span className="sr-only">Loading settings&hellip;</span>
    </div>
  );
}
