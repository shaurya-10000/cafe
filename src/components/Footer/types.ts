import type { ReactNode } from "react";

export type SubmitState = "idle" | "submitting" | "success" | "error";

export interface FooterNavLink {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
}

export interface FooterNavColumn {
  readonly heading: string;
  readonly links: readonly FooterNavLink[];
}

export interface FooterContactItem {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly href: string;
  readonly external?: boolean;
}

export interface FooterSocialItem {
  readonly name: string;
  readonly icon: ReactNode;
  readonly href: string;
  readonly external?: boolean;
}

export interface FooterBrandConfig {
  readonly name: string;
  readonly initial: string;
  readonly href: string;
}

export interface FooterStrings {
  readonly brandName: string;
  readonly brandInitial: string;
  readonly brandHomeLabel: string;
  readonly footerHeading: string;

  readonly newsletterEyebrow: string;
  readonly newsletterHeadlineLine1: string;
  readonly newsletterHeadlineLine2: string;
  readonly newsletterDescription: string;
  readonly newsletterEmailLabel: string;
  readonly newsletterPlaceholder: string;
  readonly newsletterSubmit: string;
  readonly newsletterSubmitting: string;
  readonly newsletterInvalidEmail: string;
  readonly newsletterGenericError: string;
  readonly newsletterSuccessTitle: string;
  readonly newsletterSuccessBody: string;

  readonly craftedWithCare: string;

  readonly copyrightHolder: string;
  readonly copyrightNotice: string;

  readonly attributionPrefix: string;
  readonly attributionName: string;
  readonly attributionHref: string;
}

export interface FooterProps {
  readonly brand?: FooterBrandConfig;

  readonly navColumns?: readonly FooterNavColumn[];
  readonly contactItems?: readonly FooterContactItem[];
  readonly socialItems?: readonly FooterSocialItem[];
  readonly legalLinks?: readonly FooterNavLink[];

  readonly strings?: Partial<FooterStrings>;

  readonly newsletterEndpoint?: string;
  readonly className?: string;
}
