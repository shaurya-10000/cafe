import { memo } from "react";

import { Loader2, Plus } from "lucide-react";

import { cx } from "../../lib/cx";

interface FormActionsProps {
  isEditing: boolean;
  isSaving: boolean;
  busy: boolean;
  onCancel: () => void;
}

export const FormActions = memo(function FormActions({
  isEditing,
  isSaving,
  busy,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="space-y-2">
      <button
        type="submit"
        disabled={busy}
        aria-busy={isSaving}
        className={cx(
          "flex w-full items-center justify-center gap-3 rounded-[1.2rem] py-4 font-bold transition-all active:scale-[0.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2",
          isEditing ? "bg-cafe-accent text-cafe-accent-fg" : "bg-cafe-fg text-cafe-bg",
        )}
      >
        {isSaving ? (
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <Plus size={18} aria-hidden="true" />
        )}

        <span className="text-[10px] uppercase tracking-widest">
          {isSaving
            ? "Saving..."
            : isEditing
              ? "Commit Changes"
              : "Create Location"}
        </span>
      </button>

      {isEditing && (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="w-full py-2 text-center text-[9px] font-bold uppercase tracking-widest text-gray-500 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
        >
          Cancel Editing
        </button>
      )}
    </div>
  );
});
