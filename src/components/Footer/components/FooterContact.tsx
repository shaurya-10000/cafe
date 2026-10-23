import type { FooterContactItem } from "../types";
import { ContactCard } from "./links/ContactCard";

interface FooterContactProps {
  readonly items: readonly FooterContactItem[];
  readonly reducedMotion: boolean;
}

/** Keeps id="contact": it is the target of the "/#contact" links. */
export function FooterContact({ items, reducedMotion }: FooterContactProps) {
  return (
    <div
      id="contact"
      className="mt-16 border-t border-cafe-border pt-10 sm:mt-20 sm:pt-12"
    >
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ContactCard
            key={`${item.label}-${item.href}`}
            item={item}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </div>
  );
}
