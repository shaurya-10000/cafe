import type { Dispatch, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";

export type FAQCategory = "dining" | "orders" | "reservations" | "visit";

export type FAQFilter = FAQCategory | "all";

export interface FAQEntry {
  readonly id: string;
  readonly category: FAQCategory;
  readonly q: string;
  readonly a: string;
}

export interface FAQCategoryMeta {
  readonly label: string;
  readonly blurb: string;
}

export interface SuggestedPrompt {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly prompt: string;
}

export interface FAQAndAssistantSectionProps {
  readonly entries?: readonly FAQEntry[];
  readonly categoryMeta?: Readonly<Record<FAQCategory, FAQCategoryMeta>>;
  readonly categoryOrder?: readonly FAQCategory[];
  readonly suggestedPrompts?: readonly SuggestedPrompt[];

  /**
   * Optional controlled AI-open state.
   * If omitted, the component manages its own state.
   */
  readonly isAiOpen?: boolean;

  /**
   * Optional controlled AI-open setter.
   * If omitted, the component manages its own state.
   */
  readonly setIsAiOpen?: Dispatch<SetStateAction<boolean>>;

  /**
   * Optional explicit section id (e.g. "faq-section" so "/#faq-section" links
   * resolve). If omitted, a stable per-instance id derived from `useId` is
   * used, which is collision-proof across multiple instances on one page.
   */
  readonly sectionId?: string;

  readonly className?: string;
}

export type RowNavKey = "ArrowDown" | "ArrowUp" | "Home" | "End";
