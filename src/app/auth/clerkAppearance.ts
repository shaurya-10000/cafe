import type { ComponentProps } from "react";
import type { SignIn, SignUp } from "@clerk/nextjs";

type SignInElements = NonNullable<
  ComponentProps<typeof SignIn>["appearance"]
>["elements"];
type SignUpElements = NonNullable<
  ComponentProps<typeof SignUp>["appearance"]
>["elements"];

/**
 * Per-slot class overrides for Clerk's <SignIn /> and <SignUp />. Each key
 * targets one internal Clerk element and the classes are merged onto Clerk's
 * own, so every value here adds to Clerk's defaults rather than replacing them.
 * Avoid `fixed`/`absolute` on any slot: Clerk lays these out in normal flow.
 *
 * `satisfies` type-checks the keys against both components at the definition
 * site, so a mistyped slot name fails the build instead of silently doing
 * nothing. If a page ever needs to diverge, spread and override one slot:
 *   appearance={{ elements: { ...AUTH_ELEMENTS, headerTitle: "..." } }}
 *
 * If a slot stops taking effect after a Clerk upgrade, check Clerk's current
 * appearance docs: slot names occasionally change between versions.
 */
export const AUTH_ELEMENTS = {
  rootBox: "w-full max-w-md flex justify-center",

  cardBox: "w-full shadow-none",

  card: "w-full border-none bg-transparent p-0 shadow-none",

  headerTitle: "text-2xl font-black uppercase tracking-tight text-cafe-fg",

  headerSubtitle:
    "text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400",

  formFieldLabel: "mb-2 text-xs font-bold uppercase tracking-wide text-cafe-fg",

  formFieldInput: [
    "w-full rounded-xl py-2.5 px-3",
    "border border-zinc-200 bg-zinc-100 text-cafe-fg",
    "transition-[border-color,box-shadow,background-color] duration-200",
    "placeholder:text-zinc-400",
    "hover:border-zinc-300",
    "focus:border-cafe-accent focus:outline-none",
    "focus:ring-2 focus:ring-cafe-accent/30",
    "dark:border-white/10 dark:bg-white/5",
    "dark:hover:border-white/20",
    "dark:placeholder:text-zinc-500",
  ].join(" "),

  formButtonPrimary: [
    "w-full rounded-xl py-3 mt-2",
    "bg-zinc-900 text-xs font-black uppercase tracking-widest text-white",
    "shadow-md",
    "transition-[background-color,box-shadow,transform] duration-200",
    "hover:bg-zinc-800 hover:shadow-lg",
    "active:scale-[0.99]",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-cafe-accent",
    "focus-visible:ring-offset-2",
    "dark:bg-zinc-100 dark:text-black",
    "dark:hover:bg-zinc-200",
    "dark:focus-visible:ring-offset-zinc-950",
  ].join(" "),

  footerActionLink: [
    "rounded font-bold text-cafe-accent",
    "transition-colors duration-200",
    "hover:underline",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-cafe-accent",
    "focus-visible:ring-offset-2",
  ].join(" "),

  socialButtonsBlockButton: [
    "rounded-xl py-2.5",
    "border border-zinc-200 bg-transparent",
    "font-medium text-cafe-fg",
    "transition-[background-color,border-color] duration-200",
    "hover:border-zinc-300 hover:bg-zinc-100",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-cafe-accent",
    "dark:border-white/10",
    "dark:hover:border-white/20 dark:hover:bg-white/5",
  ].join(" "),

  socialButtonsBlockButtonText: "text-sm font-semibold text-cafe-fg",

  dividerLine: "bg-zinc-200 dark:bg-white/10",

  dividerText:
    "text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500",

  identityPreviewEditButton: [
    "rounded text-cafe-accent",
    "transition-colors duration-200",
    "hover:text-cafe-accent/80",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-cafe-accent",
    "focus-visible:ring-offset-2",
  ].join(" "),

  alert: [
    "rounded-xl p-3",
    "border border-red-500/20",
    "bg-red-500/10",
    "text-sm text-red-600",
    "dark:text-red-400",
  ].join(" "),

  formFieldErrorText: "mt-1 text-xs font-medium text-red-600 dark:text-red-400",

  formFieldSuccessText:
    "mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400",
} satisfies SignInElements & SignUpElements;
