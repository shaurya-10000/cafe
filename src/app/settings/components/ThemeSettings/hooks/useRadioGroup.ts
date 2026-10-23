import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";

export interface RadioItemProps {
  readonly role: "radio";
  readonly "aria-checked": boolean;
  readonly tabIndex: 0 | -1;
  readonly onClick: () => void;
  readonly ref: (node: HTMLButtonElement | null) => void;
}

/**
 * ARIA radiogroup behaviour for card-style radios: roving tabindex (one tab
 * stop, on the selected item) and arrow/Home/End keys that move selection and
 * focus together. Without this, `role="radio"` buttons are each a tab stop and
 * ignore the arrow keys assistive-tech users expect.
 */
export function useRadioGroup<T extends string>(
  values: readonly T[],
  selected: T | undefined,
  onSelect: (value: T) => void,
) {
  const itemRefs = useRef(new Map<T, HTMLButtonElement>());

  const tabStop: T | undefined =
    selected !== undefined && values.includes(selected) ? selected : values[0];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (tabStop === undefined) return;
      const current = values.indexOf(tabStop);
      if (current === -1) return;

      let next: number;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = (current + 1) % values.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = (current - 1 + values.length) % values.length;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = values.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const value = values[next];
      if (value === undefined) return;
      onSelect(value);
      itemRefs.current.get(value)?.focus();
    },
    [tabStop, values, onSelect],
  );

  const getItemProps = useCallback(
    (value: T): RadioItemProps => ({
      role: "radio",
      "aria-checked": value === selected,
      tabIndex: value === tabStop ? 0 : -1,
      onClick: () => onSelect(value),
      ref: (node) => {
        if (node) itemRefs.current.set(value, node);
        else itemRefs.current.delete(value);
      },
    }),
    [selected, tabStop, onSelect],
  );

  return {
    groupProps: { role: "radiogroup" as const, onKeyDown: handleKeyDown },
    getItemProps,
  };
}
