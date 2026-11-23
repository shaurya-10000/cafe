import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Cafe",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Last updated: November 2026
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <h2 className="text-base font-bold uppercase tracking-wider text-cafe-fg">
            1. Information We Collect
          </h2>
          <p>
            When you create an account, place an order, subscribe to our
            newsletter, or book a table, we collect only the details needed to
            fulfill your request (such as your name, email address, phone
            number, delivery address, and order history).
          </p>

          <h2 className="text-base font-bold uppercase tracking-wider text-cafe-fg">
            2. Payments &amp; Security
          </h2>
          <p>
            Online payments are processed directly by Stripe. We never store
            your raw card details on our servers. Authentication is handled by
            Clerk, and database access is protected by row-level security.
          </p>

          <h2 className="text-base font-bold uppercase tracking-wider text-cafe-fg">
            3. AI Concierge &amp; Notifications
          </h2>
          <p>
            Signed-in chat history is stored privately for your account so you
            can resume conversations. Web push and in-app notifications can be
            muted or disabled anytime from your notification preferences.
          </p>

          <h2 className="text-base font-bold uppercase tracking-wider text-cafe-fg">
            4. Contact
          </h2>
          <p>
            For privacy questions or data removal requests, please reach out via
            our contact details in the footer.
          </p>
        </section>
      </div>
    </main>
  );
}