// src/lib/utils/cn.ts
//
// Single-line re-export of the canonical `cn` helper. `clsx` handles the
// conditional-class truth table (`{ "a": cond, "b": !cond }`, arrays,
// falsy values) and `tailwind-merge` resolves conflicting Tailwind
// utilities by source order, so `cn("p-4", "p-8")` produces `"p-8"`.
//
// Every component that imports `cn` — ChatWidget, header.tsx, and any
// other consumer — gets the same function from this one path. Do not
// re-implement `cn` locally in a component; the merge behavior is subtle
// (arbitrary values, modifiers, negative values) and duplicate copies
// drift out of sync the moment one is edited.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
