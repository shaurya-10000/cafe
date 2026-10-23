import { memo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { isHashAnchor } from "../../lib/links";

interface InternalLinkProps {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
  readonly ariaLabel?: string;
}

export const InternalLink = memo(function InternalLink({
  href,
  className,
  children,
  ariaLabel,
}: InternalLinkProps) {
  if (isHashAnchor(href)) {
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
});
