import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Cafe",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-cafe-bg px-6 py-20 text-cafe-fg">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cafe-accent hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Cafe
        </Link>

        <header className="space-y-3 border-b border-cafe-border pb-6">
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Last updated: November 2026
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <h2 className="text-base font-bold uppercase tracking-wider text-cafe-fg">
            1. Orders &amp; Pricing
          </h2>
          <p>
            All menu prices, discounts, and order totals are calculated and
            verified by our server at checkout. Items marked Sold Out or orders
            placed while the cafe is closed cannot be submitted.
          </p>

          <h2 className="text-base font-bold uppercase tracking-wider text-cafe-fg">
            2. Table Reservations
          </h2>
          <p>
            Reservations are subject to branch opening hours, holiday closures,
            and capacity limits. Tables are held for a 15-minute grace period
            from your booking time.
          </p>

          <h2 className="text-base font-bold uppercase tracking-wider text-cafe-fg">
            3. Cancellations &amp; Refunds
          </h2>
          <p>
            You may cancel pending or confirmed reservations from your customer
            dashboard. Approved refunds for online orders are processed back to
            your original payment method via Stripe.
          </p>
        </section>
      </div>
    </main>
  );
}