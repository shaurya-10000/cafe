import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

import { ArrowUpDown, ChevronDown } from "lucide-react";

import { SORT_LABELS, SORT_OPTIONS } from "../constants";
import type { SortOption } from "../types";

interface SortMenuProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export const SortMenu = memo(function SortMenu({
  value,
  onChange,
}: SortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!isOpen) return;

    optionRefs.current[SORT_OPTIONS.indexOf(value)]?.focus();

    const handleMouseDown = (event: MouseEvent): void => {
      const target = event.target;

      if (
        target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, value]);

  const handleOptionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        optionRefs.current[(index + 1) % SORT_OPTIONS.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        optionRefs.current[
          (index - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length
        ]?.focus();
      }
    },
    [],
  );

  const handleSelect = useCallback(
    (option: SortOption) => {
      onChange(option);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-3 rounded-full border border-[#EAE9E4] bg-[#F5F5F1] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
      >
        <ArrowUpDown size={14} aria-hidden="true" />

        {SORT_LABELS[value]}

        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            aria-label="Sort menu items by"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 z-50 mt-2 w-56 rounded-3xl border border-[#EAE9E4] bg-[#FAF9F6] p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {SORT_OPTIONS.map((option, index) => (
              <button
                key={option}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => handleSelect(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                className="w-full rounded-2xl px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all hover:bg-[#F5F5F1] hover:text-cafe-accent focus:bg-[#F5F5F1] focus:text-cafe-accent focus:outline-none dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
              >
                {SORT_LABELS[option]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
