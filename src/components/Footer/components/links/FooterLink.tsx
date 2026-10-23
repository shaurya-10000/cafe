import { memo } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "../../styles";
import type { FooterNavLink } from "../../types";
import { InternalLink } from "./InternalLink";

interface FooterLinkProps {
  readonly link: FooterNavLink;
}

const LINK_CLASSES = cn(
  "group inline-flex items-center gap-1 text-sm",
  "text-cafe-fg/60 hover:text-cafe-fg",
  "transition-colors duration-200",
  "motion-reduce:transition-none",
  FOCUS_RING,
);

const ARROW_CLASSES = cn(
  "opacity-0",
  "transition-all duration-200",
  "group-hover:opacity-100",
  "group-focus-visible:opacity-100",
  "motion-reduce:transition-none",
);

const INTERNAL_ARROW_CLASSES = cn(
  ARROW_CLASSES,
  "-translate-x-1",
  "group-hover:translate-x-0",
  "group-focus-visible:translate-x-0",
);

export const FooterLink = memo(function FooterLink({ link }: FooterLinkProps) {
  const content = (
    <>
      <span>{link.label}</span>

      {link.external ? (
        <ArrowUpRight aria-hidden="true" size={13} className={ARROW_CLASSES} />
      ) : (
        <ArrowRight
          aria-hidden="true"
          size={13}
          className={INTERNAL_ARROW_CLASSES}
        />
      )}
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASSES}
      >
        {content}
      </a>
    );
  }

  return (
    <InternalLink href={link.href} className={LINK_CLASSES}>
      {content}
    </InternalLink>
  );
});
