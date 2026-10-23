import { memo, useCallback, useRef, type KeyboardEvent } from "react";

import { CATEGORIES } from "../constants";
import type { Category } from "../types";

interface CategoryTabsProps {
  active: Category;
  onChange: (category: Category) => void;
}

export const CategoryTabs = memo(function CategoryTabs({
  active,
  onChange,
}: CategoryTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const focusTab = (target: number): void => {
        tabRefs.current[target]?.focus();
      };

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          focusTab((index + 1) % CATEGORIES.length);
          break;

        case "ArrowLeft":
          event.preventDefault();
          focusTab((index - 1 + CATEGORIES.length) % CATEGORIES.length);
          break;

        case "Home":
          event.preventDefault();
          focusTab(0);
          break;

        case "End":
          event.preventDefault();
          focusTab(CATEGORIES.length - 1);
          break;

        default:
          break;
      }
    },
    [],
  );

  return (
    <div
      role="tablist"
      aria-label="Menu categories"
      className="flex flex-wrap justify-center gap-2 rounded-full border border-[#EAE9E4] bg-[#F5F5F1] p-1.5 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      {CATEGORIES.map((category, index) => {
        const selected = active === category;

        return (
          <button
            key={category}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(category)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent ${
              selected
                ? "bg-white text-cafe-accent shadow-sm dark:bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
});
