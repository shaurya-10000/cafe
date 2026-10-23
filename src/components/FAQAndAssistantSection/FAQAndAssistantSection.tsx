"use client";

import { useId, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CategoryFilters } from "./components/CategoryFilters";
import { ConciergeChat } from "./components/ConciergeChat";
import { ConciergeFloatingButton } from "./components/ConciergeButtons";
import { FaqHeader } from "./components/FaqHeader";
import { FaqList } from "./components/FaqList";
import { FaqSidebar } from "./components/FaqSidebar";
import {
  DEFAULT_CATEGORY_META,
  DEFAULT_CATEGORY_ORDER,
} from "./data/categories";
import { DEFAULT_FAQ_ENTRIES } from "./data/entries";
import { DEFAULT_SUGGESTED_PROMPTS } from "./data/prompts";
import { useAiOpenState } from "./hooks/useAiOpenState";
import { useFaqAccordion } from "./hooks/useFaqAccordion";
import { useRowKeyboardNav } from "./hooks/useRowKeyboardNav";
import { createFaqIds } from "./lib/ids";
import type { FAQAndAssistantSectionProps } from "./types";

export function FAQAndAssistantSection({
  entries = DEFAULT_FAQ_ENTRIES,
  categoryMeta = DEFAULT_CATEGORY_META,
  categoryOrder = DEFAULT_CATEGORY_ORDER,
  suggestedPrompts = DEFAULT_SUGGESTED_PROMPTS,
  isAiOpen: externalIsAiOpen,
  setIsAiOpen: externalSetIsAiOpen,
  sectionId: externalSectionId,
  className,
}: FAQAndAssistantSectionProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const baseId = useId();
  const ids = useMemo(() => createFaqIds(baseId), [baseId]);

  const ai = useAiOpenState(externalIsAiOpen, externalSetIsAiOpen);

  const faq = useFaqAccordion({ entries, categoryOrder, categoryMeta });
  const rowNav = useRowKeyboardNav(faq.filteredEntries);

  return (
    <section
      id={externalSectionId ?? ids.defaultSection}
      aria-labelledby={ids.heading}
      className={cn(
        "overflow-hidden border-t border-cafe-border",
        "bg-cafe-bg py-24",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <FaqHeader
          headingId={ids.heading}
          isAiOpen={ai.isOpen}
          onOpenAi={ai.open}
          reducedMotion={reducedMotion}
        />

        <CategoryFilters
          ids={ids}
          categories={faq.categories}
          categoryMeta={categoryMeta}
          counts={faq.categoryCounts}
          totalCount={entries.length}
          activeFilter={faq.activeFilter}
          onChange={faq.changeFilter}
        />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <FaqList
            ids={ids}
            entries={faq.filteredEntries}
            activeFilter={faq.activeFilter}
            openId={faq.openId}
            reducedMotion={reducedMotion}
            onToggle={faq.toggle}
            onKeyNav={rowNav.navigate}
            registerButton={rowNav.registerButton}
          />

          <FaqSidebar
            categories={faq.categories}
            categoryMeta={categoryMeta}
            counts={faq.categoryCounts}
            isAiOpen={ai.isOpen}
            onOpenAi={ai.open}
          />
        </div>

        <ConciergeFloatingButton isOpen={ai.isOpen} onOpen={ai.open} />
      </div>

      <ConciergeChat
        isOpen={ai.isOpen}
        onClose={ai.close}
        suggestedPrompts={suggestedPrompts}
      />
    </section>
  );
}

FAQAndAssistantSection.displayName = "FAQAndAssistantSection";

export default FAQAndAssistantSection;
