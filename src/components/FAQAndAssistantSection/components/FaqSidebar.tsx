import { cn } from "@/lib/utils";
import { formatCount } from "../lib/categories";
import type { FAQCategory, FAQCategoryMeta } from "../types";
import { ConciergeLinkButton } from "./ConciergeButtons";

interface FaqSidebarProps {
  readonly categories: readonly FAQCategory[];
  readonly categoryMeta: Readonly<Record<FAQCategory, FAQCategoryMeta>>;
  readonly counts: Readonly<Record<FAQCategory, number>>;
  readonly isAiOpen: boolean;
  readonly onOpenAi: () => void;
}

export function FaqSidebar({
  categories,
  categoryMeta,
  counts,
  isAiOpen,
  onOpenAi,
}: FaqSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div
        className={cn(
          "sticky top-24 space-y-8",
          "border-l border-cafe-border pl-8",
        )}
      >
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cafe-fg/50">
            Categories
          </p>

          <ul className="space-y-3 text-sm">
            {categories.map((category) => (
              <li
                key={category}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="font-black uppercase tracking-tight text-cafe-fg">
                  {categoryMeta[category].label}
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-cafe-fg/50 tabular-nums">
                  {formatCount(counts[category])}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 border-t border-cafe-border pt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cafe-fg/50">
            Still stuck?
          </p>

          <p className="text-sm font-medium leading-relaxed text-cafe-fg/70">
            Our AI concierge can answer follow-ups, check availability, and hand
            you off to a human when needed.
          </p>

          <ConciergeLinkButton isOpen={isAiOpen} onOpen={onOpenAi} />
        </div>
      </div>
    </aside>
  );
}
