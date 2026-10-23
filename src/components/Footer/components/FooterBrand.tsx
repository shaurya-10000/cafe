import { cn } from "@/lib/utils";
import { FOCUS_RING } from "../styles";
import type { FooterBrandConfig } from "../types";
import { InternalLink } from "./links/InternalLink";

interface FooterBrandProps {
  readonly brand: FooterBrandConfig;
  readonly homeLabel: string;
}

export function FooterBrand({ brand, homeLabel }: FooterBrandProps) {
  return (
    <InternalLink
      href={brand.href}
      ariaLabel={homeLabel}
      className={cn("inline-flex items-center gap-3 rounded-lg", FOCUS_RING)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 items-center justify-center",
          "rounded-full bg-cafe-fg",
          "font-serif text-lg font-semibold",
          "text-cafe-bg",
        )}
      >
        {brand.initial}
      </span>

      <span className="font-serif text-2xl font-medium tracking-tight">
        {brand.name}
      </span>
    </InternalLink>
  );
}
