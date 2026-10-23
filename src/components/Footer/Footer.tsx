"use client";

import { memo, useId, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FooterBackdrop } from "./components/FooterBackdrop";
import { FooterBottomBar } from "./components/FooterBottomBar";
import { FooterBrand } from "./components/FooterBrand";
import { FooterContact } from "./components/FooterContact";
import { FooterNav } from "./components/FooterNav";
import { NewsletterForm } from "./components/newsletter/NewsletterForm";
import { DEFAULT_NEWSLETTER_ENDPOINT } from "./constants";
import {
  DEFAULT_BRAND,
  DEFAULT_CONTACT_ITEMS,
  DEFAULT_LEGAL_LINKS,
  DEFAULT_NAV_COLUMNS,
  DEFAULT_SOCIAL_ITEMS,
} from "./defaults";
import { useCurrentYear } from "./hooks/useCurrentYear";
import { DEFAULT_STRINGS } from "./strings";
import type { FooterProps, FooterStrings } from "./types";

const Footer = memo(function Footer({
  brand = DEFAULT_BRAND,
  navColumns = DEFAULT_NAV_COLUMNS,
  contactItems = DEFAULT_CONTACT_ITEMS,
  socialItems = DEFAULT_SOCIAL_ITEMS,
  legalLinks = DEFAULT_LEGAL_LINKS,
  strings: stringsOverride,
  newsletterEndpoint = DEFAULT_NEWSLETTER_ENDPOINT,
  className,
}: FooterProps) {
  const headingId = useId();
  const reducedMotion = useReducedMotion() ?? false;
  const currentYear = useCurrentYear();

  const strings = useMemo<FooterStrings>(
    () => ({ ...DEFAULT_STRINGS, ...stringsOverride }),
    [stringsOverride],
  );

  return (
    <footer
      aria-labelledby={headingId}
      className={cn(
        "relative overflow-hidden",
        "bg-cafe-bg text-cafe-fg",
        className,
      )}
    >
      <FooterBackdrop />

      <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <h2 id={headingId} className="sr-only">
          {strings.footerHeading}
        </h2>

        <div className="grid gap-16 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div>
            <FooterBrand brand={brand} homeLabel={strings.brandHomeLabel} />

            <div className="mt-10">
              <NewsletterForm
                reducedMotion={reducedMotion}
                endpoint={newsletterEndpoint}
                strings={strings}
              />
            </div>
          </div>

          <FooterNav columns={navColumns} />
        </div>

        <FooterContact items={contactItems} reducedMotion={reducedMotion} />

        <FooterBottomBar
          socialItems={socialItems}
          legalLinks={legalLinks}
          strings={strings}
          year={currentYear}
        />
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
