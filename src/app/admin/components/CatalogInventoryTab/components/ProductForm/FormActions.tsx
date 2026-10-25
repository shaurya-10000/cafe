import { memo } from "react";

import { ChevronRight, Loader2 } from "lucide-react";

import { cx } from "../../lib/cx";

interface FormActionsProps {
  isEditing: boolean;
  submitting: boolean;
  disabled: boolean;
  onCancel: () => void;
}

export const FormActions = memo(function FormActions({
  isEditing,
  submitting,
  disabled,
  onCancel,
}: FormActionsProps) {
  return (
    <>
      <button
        type="submit"
        disabled={disabled}
        aria-busy={submitting}
        className={cx(
          "flex w-full items-center justify-center gap-3 rounded-[1.2rem] py-4 font-bold transition-all active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2",
          isEditing ? "bg-cafe-accent text-cafe-accent-fg" : "bg-cafe-fg text-cafe-bg",
        )}
      >
        {submitting ? (
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <ChevronRight size={18} aria-hidden="true" />
        )}

        <span className="text-[10px] uppercase tracking-widest">
          {submitting
            ? "Syncing..."
            : isEditing
              ? "Commit Changes"
              : "Execute Sync"}
        </span>
      </button>

      {isEditing && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-center text-[9px] font-bold uppercase tracking-widest text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
        >
          Cancel Editing
        </button>
      )}
    </>
  );
});
