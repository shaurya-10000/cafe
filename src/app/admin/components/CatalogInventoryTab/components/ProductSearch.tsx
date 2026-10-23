import { memo } from "react";

import { Search, X } from "lucide-react";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProductSearch = memo(function ProductSearch({
  value,
  onChange,
}: ProductSearchProps) {
  return (
    <div className="relative min-w-[150px] flex-1">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        size={16}
        aria-hidden="true"
      />

      <input
        type="text"
        value={value}
        aria-label="Search products"
        placeholder="Search products..."
        className="w-full rounded-2xl border-none bg-cafe-fg/[0.04] py-3 pl-12 pr-10 text-sm text-cafe-fg outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(event) => onChange(event.target.value)}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-cafe-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});
