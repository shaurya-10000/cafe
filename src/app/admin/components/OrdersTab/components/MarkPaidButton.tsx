import { memo } from "react";

import { Banknote } from "lucide-react";

interface MarkPaidButtonProps {
  onClick: () => void;
}

export const MarkPaidButton = memo(function MarkPaidButton({
  onClick,
}: MarkPaidButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Mark order as paid"
      title="Mark as paid"
      className="rounded-2xl bg-green-600 p-4 text-white shadow-xl shadow-green-600/20 transition-all hover:bg-green-500 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
    >
      <Banknote size={20} aria-hidden="true" />
    </button>
  );
});
