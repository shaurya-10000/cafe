"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  AUTH_IMAGE_EXTENSIONS,
  isValidAuthImageSource,
  isNonEmptyHeadline,
} from "@/lib/auth/imageValidation";

// Re-export for any external consumers relying on the old import paths
export { AUTH_IMAGE_EXTENSIONS, isValidAuthImageSource, isNonEmptyHeadline };

export interface AuthLayoutProps {
  children: React.ReactNode;
  bgImageSrc: string;
  headline: React.ReactNode;
  description: string;
  badges: readonly string[];
}

const PANEL_INITIAL = { opacity: 0, x: -10 } as const;
const PANEL_ANIMATE = { opacity: 1, x: 0 } as const;
const HEADLINE_INITIAL = { opacity: 0, y: 20 } as const;
const HEADLINE_ANIMATE = { opacity: 1, y: 0 } as const;
const PANEL_EASE = [0.16, 1, 0.3, 1] as const;

export default function AuthLayout({
  children,
  bgImageSrc,
  headline,
  description,
  badges,
}: AuthLayoutProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  // Under reduced motion, start at the final state so no transition
  // plays. Setting `duration: 0` alone would still allocate a frame of
  // animation budget and, on some Framer Motion versions, still emit an
  // initial `x: -10` / `y: 20` frame before collapsing.
  const initialPanelAnimation = shouldReduceMotion ? PANEL_ANIMATE : PANEL_INITIAL;
  const initialHeadlineAnimation = shouldReduceMotion ? HEADLINE_ANIMATE : HEADLINE_INITIAL;
  const animationDuration = shouldReduceMotion ? 0 : 0.8;

  return (
    <div className="flex min-h-screen bg-cafe-bg transition-colors duration-300 selection:bg-cafe-accent selection:text-white">
      {/* Desktop visual panel */}
      <motion.div
        initial={initialPanelAnimation}
        animate={PANEL_ANIMATE}
        transition={{ duration: animationDuration, ease: PANEL_EASE }}
        className="group relative hidden flex-col justify-between overflow-hidden border-r border-cafe-border p-12 lg:flex lg:w-1/2"
      >
        {/* Desktop navigation */}
        <nav aria-label="Authentication navigation" className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-cafe-border bg-cafe-card/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:bg-cafe-card hover:text-cafe-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Back to Cafe</span>
          </Link>
        </nav>

        {/* Decorative background image */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden opacity-40 grayscale contrast-125 dark:opacity-20"
        >
          <Image
            src={bgImageSrc}
            alt=""
            fill
            sizes="50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-cafe-bg"
          />
        </div>

        {/* Desktop visual content */}
        <div className="relative z-10 space-y-8">
          <div className="max-w-lg space-y-6">
            <motion.h1
              initial={initialHeadlineAnimation}
              animate={HEADLINE_ANIMATE}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.2,
                duration: animationDuration,
                ease: PANEL_EASE,
              }}
              className="text-6xl font-black uppercase leading-[0.9] tracking-tighter text-cafe-fg 2xl:text-7xl"
            >
              {headline}
            </motion.h1>

            <p className="max-w-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>

          {badges.length > 0 && (
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
              <div aria-hidden="true" className="h-px w-8 bg-cafe-border" />
              <div className="flex items-center gap-4">
                {badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Authentication content */}
      <main className="relative flex w-full flex-col items-center justify-center p-6 md:p-12 lg:w-1/2">
        {/* Mobile navigation */}
        <nav aria-label="Authentication navigation" className="absolute left-8 top-8 lg:hidden">
          <Link
            href="/"
            aria-label="Back to home page"
            className="inline-flex items-center justify-center rounded-full border border-cafe-border bg-cafe-card p-3 text-zinc-500 transition-colors hover:text-cafe-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </nav>

        <div className="z-10 flex w-full max-w-md justify-center">
          {children}
        </div>

        {/* Ambient decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-full w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-cafe-accent/5 blur-[120px]"
        />
      </main>
    </div>
  );
}
