import { memo, useEffect, useId, useRef } from "react";

import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";
import type { ActionPayload } from "@/types/action";

interface ConfirmationDialogProps {
  readonly action: ActionPayload;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly accentGradientClassName: string;
}

export const ConfirmationDialog = memo(function ConfirmationDialog({
  action,
  onConfirm,
  onCancel,
  accentGradientClassName,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => cancelRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "w-full max-w-sm rounded-2xl border border-cafe-border",
          "bg-cafe-bg p-6 shadow-2xl",
        )}
      >
        <h3
          id={titleId}
          className="mb-2 text-sm font-black uppercase tracking-widest text-cafe-fg"
        >
          Confirm Action
        </h3>
        <p className="mb-6 text-xs leading-relaxed text-cafe-fg/70">
          {action.label}
        </p>

        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={cn(
              "rounded-xl border border-cafe-border px-4 py-2",
              "text-[10px] font-black uppercase tracking-widest text-cafe-fg",
              "hover:bg-cafe-fg/5",
              FOCUS_RING,
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-xl px-4 py-2",
              accentGradientClassName,
              "text-[10px] font-black uppercase tracking-widest text-white",
              "shadow-md",
              FOCUS_RING,
            )}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
});