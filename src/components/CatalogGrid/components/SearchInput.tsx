import { memo } from "react";

import { Search } from "lucide-react";

import type { Category } from "../types";

interface SearchInputProps {
  value: string;
  category: Category;
  onChange: (value: string) => void;
}

export const SearchInput = memo(function SearchInput({
  value,
  category,
  onChange,
}: SearchInputProps) {
  return (
    <div className="group relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-zinc-400 transition-colors group-focus-within:text-cafe-accent">
        <Search size={16} aria-hidden="true" />
      </div>

      <input
        type="search"
        aria-label={`Search in ${category}`}
        placeholder={`Search in ${category}...`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-[#EAE9E4] bg-[#F5F5F1] py-4 pl-12 pr-6 text-sm font-bold outline-none transition-all focus:border-cafe-accent focus:ring-2 focus:ring-cafe-accent/20 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
      />
    </div>
  );
});
