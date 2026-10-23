import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY, MIN_QUANTITY } from "../../constants";
import { cx } from "../../lib/cx";
import { FOCUS_RING } from "../../styles";

interface QuantityStepperProps {
  readonly quantity: number;
  readonly onDecrement: () => void;
  readonly onIncrement: () => void;
}

const STEP_BUTTON_CLASSES =
  "rounded-full p-2 transition-colors hover:bg-white disabled:opacity-30 dark:hover:bg-zinc-800";

export function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-100 p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onDecrement}
        disabled={quantity <= MIN_QUANTITY}
        aria-label="Decrease quantity"
        className={cx(STEP_BUTTON_CLASSES, FOCUS_RING)}
      >
        <Minus size={14} aria-hidden="true" />
      </button>

      <span
        className="w-6 text-center text-sm font-black tabular-nums"
        aria-live="polite"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= MAX_QUANTITY}
        aria-label="Increase quantity"
        className={cx(STEP_BUTTON_CLASSES, FOCUS_RING)}
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
