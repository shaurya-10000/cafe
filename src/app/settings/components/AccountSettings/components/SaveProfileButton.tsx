import { Loader2 } from "lucide-react";

interface SaveProfileButtonProps {
  readonly saving: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}

export function SaveProfileButton({
  saving,
  disabled,
  onClick,
}: SaveProfileButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-full bg-zinc-900 px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-zinc-900/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-black"
    >
      {saving && (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      )}
      {saving ? "Saving..." : "Update Profile"}
    </button>
  );
}
