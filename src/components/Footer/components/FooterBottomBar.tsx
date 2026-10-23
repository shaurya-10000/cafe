import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "../styles";
import type {
  FooterNavLink,
  FooterSocialItem,
  FooterStrings,
} from "../types";
import { FooterLink } from "./links/FooterLink";
import { SocialLink } from "./links/SocialLink";

interface FooterBottomBarProps {
  readonly socialItems: readonly FooterSocialItem[];
  readonly legalLinks: readonly FooterNavLink[];
  readonly strings: FooterStrings;
  readonly year: number;
}

export function FooterBottomBar({
  socialItems,
  legalLinks,
  strings,
  year,
}: FooterBottomBarProps) {
  return (
    <div className="mt-12 border-t border-cafe-border pt-7">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Social media">
          <ul className="flex items-center gap-2">
            {socialItems.map((social) => (
              <li key={`${social.name}-${social.href}`}>
                <SocialLink item={social} />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-cafe-fg/40">
          {`\u00a9 ${year} ${strings.copyrightHolder}. ${strings.copyrightNotice}`}
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-2 border-t border-cafe-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-cafe-fg/40">{strings.craftedWithCare}</p>

        <a
          href={strings.attributionHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex w-fit items-center gap-1.5",
            "text-xs text-cafe-fg/40",
            "transition-colors duration-200",
            "hover:text-cafe-fg",
            "motion-reduce:transition-none",
            FOCUS_RING,
          )}
        >
          {strings.attributionPrefix}{" "}
          <span className="font-medium text-cafe-fg/70">
            {strings.attributionName}
          </span>
          <ArrowUpRight aria-hidden="true" size={12} />
        </a>
      </div>
    </div>
  );
}
