import Link from "next/link";
import { ArrowLeft, Coffee } from "lucide-react";

export const metadata = {
  title: "About | Cafe",
};

export default function AboutPage() {
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
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cafe-accent">
            <Coffee size={15} aria-hidden="true" />
            Our Story
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Crafted Daily, Served Warm
          </h1>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <p>
            We started with a simple ritual: small-batch espresso, pastries
            baked fresh every morning, and spaces designed to slow down in.
          </p>
          <p>
            Whether you&apos;re picking up a morning flat white, reserving a
            corner table for the afternoon, or ordering through our AI
            concierge, every detail is built to keep your visit effortless.
          </p>
        </section>
      </div>
    </main>
  );
}