import { VIEW_OPTIONS } from "../constants";
import { SWITCHER_CLASS, buildViewButtonClass } from "../styles";
import type { OrderView } from "../types";

interface ViewSwitcherProps {
  view: OrderView;
  counts: Record<OrderView, number>;
  onChange: (view: OrderView) => void;
}

export function ViewSwitcher({ view, counts, onChange }: ViewSwitcherProps) {
  return (
    <div className={SWITCHER_CLASS}>
      {VIEW_OPTIONS.map((option) => {
        const isActive = view === option.id;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={buildViewButtonClass(isActive, option)}
          >
            {option.label} ({counts[option.id]})
          </button>
        );
      })}
    </div>
  );
}