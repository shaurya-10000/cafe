import type { Metadata } from "next";

/**
 * Landing-page metadata.
 *
 * This is not a Next.js special file — the framework does not read
 * `app/metadata.ts` automatically. It exists purely so the landing page
 * (`app/page.tsx`) can spread it into its own `export const metadata`
 * without inlining a block of strings into the page component. Every
 * other page relies on the root layout's default metadata (title +
 * template, description) from `app/layout.tsx`.
 *
 * Usage from the landing page:
 *
 *     import { landingPageMetadata } from "./metadata";
 *     export const metadata: Metadata = landingPageMetadata;
 *
 * If that import is ever removed — e.g. the landing page is deleted, or
 * its title starts coming from a CMS — delete this file too. An orphaned
 * `Metadata` object in the tree is a trap: a future reader will assume
 * it's wired up when it isn't.
 */
export const landingPageMetadata: Metadata = {
  title: "Cafe | Premium AI Experiences for Modern Businesses",
  description:
    "Elevate your cafe, salon, or retail shop with Cafe's real-time AI orchestration and custom digital dashboards.",
  keywords: [
    // Ordered by specificity: brand first, then the two highest-intent
    // search phrases, then the underlying tech (which occasionally
    // appears in dev-oriented SERPs and blog backlinks).
    "Cafe",
    "AI business automation",
    "cafe POS with AI",
    "salon booking system",
    "restaurant digital dashboard",
    "Next.js",
    "Supabase",
  ],
  // `metadataBase` is deliberately inherited from the root layout (which
  // doesn't set one yet). The moment this page gains an `openGraph` image
  // or a `canonical`, add `metadataBase` here or in the root layout —
  // otherwise Next.js will resolve the URL against `http://localhost:3000`
  // in production and ship a broken link preview.
  openGraph: {
    title: "Cafe | Premium AI Experiences for Modern Businesses",
    description:
      "Real-time AI orchestration and custom digital dashboards for modern cafes, salons, and retail shops.",
    type: "website",
    siteName: "Cafe",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cafe | Premium AI Experiences for Modern Businesses",
    description:
      "Real-time AI orchestration and custom digital dashboards for modern cafes, salons, and retail shops.",
  },
};

/**
 * Backwards-compatibility alias.
 *
 * Older code imported this as `{ metadata }`. It's kept here so those
 * imports don't break during the rename. New code should import
 * `landingPageMetadata` — the alias will be removed once a repo-wide
 * search confirms nothing still references it.
 *
 * @deprecated Use `landingPageMetadata` instead.
 */
export const metadata = landingPageMetadata;