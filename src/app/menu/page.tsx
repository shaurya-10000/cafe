import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Full Menu | Cafe",
  description: "Explore our full selection of coffee, cold drinks, and pastries.",
};

export default function MenuPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-cafe-bg px-4 py-12 transition-colors duration-300 md:py-24">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Back navigation */}
        <div>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full bg-cafe-fg/5 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-cafe-fg transition-colors hover:bg-cafe-fg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
          >
            <ChevronLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            Back to Cafe
          </Link>
        </div>

        {/* Menu Image Container */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-cafe-border bg-[#111] shadow-2xl">
          <Image
            src="/images/cafe-menu.webp"
            alt="Cafe Menu showing Coffee, Cold drinks, and Pastry options with prices"
            width={1200}
            height={1500}
            className="h-auto w-full object-contain"
            priority
          />
        </div>
        
      </div>
    </main>
  );
}
