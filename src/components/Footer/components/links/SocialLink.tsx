import { memo } from "react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "../../styles";
import type { FooterSocialItem } from "../../types";
import { InternalLink } from "./InternalLink";

interface SocialLinkProps {
  readonly item: FooterSocialItem;
}

const SOCIAL_CLASSES = cn(
  "inline-flex size-10 items-center justify-center",
  "rounded-full border border-cafe-border",
  "text-cafe-fg/60",
  "transition-all duration-200",
  "hover:border-cafe-fg",
  "hover:bg-cafe-fg",
  "hover:text-cafe-bg",
  "motion-reduce:transition-none",
  FOCUS_RING,
);

export const SocialLink = memo(function SocialLink({ item }: SocialLinkProps) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.name}
        className={SOCIAL_CLASSES}
      >
        {item.icon}
      </a>
    );
  }

  return (
    <InternalLink
      href={item.href}
      ariaLabel={item.name}
      className={SOCIAL_CLASSES}
    >
      {item.icon}
    </InternalLink>
  );
});
