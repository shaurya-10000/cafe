import Link from "next/link";

import { Heart } from "lucide-react";

import { SKELETON_KEYS } from "../constants";
import {
  EMPTY_CLASS,
  EMPTY_HINT_CLASS,
  EMPTY_LINK_CLASS,
  EMPTY_TEXT_CLASS,
  GRID_CLASS,
  SKELETON_CARD_CLASS,
} from "../styles";

export function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className={GRID_CLASS}>
      <span className="sr-only">Loading favorites&hellip;</span>

      {SKELETON_KEYS.map((key) => (
        <div key={key} aria-hidden="true" className={SKELETON_CARD_CLASS}>
          <div className="h-11 w-11 rounded-xl bg-cafe-fg/10" />

          <div className="space-y-3">
            <div className="h-5 w-40 rounded-full bg-cafe-fg/10" />
            <div className="h-3 w-16 rounded-full bg-cafe-fg/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className={EMPTY_CLASS}>
      <Heart
        size={44}
        className="mb-4 text-cafe-favorite/60"
        strokeWidth={1.5}
        aria-hidden="true"
      />

      <p className={EMPTY_TEXT_CLASS}>No favorites yet</p>

      <p className={EMPTY_HINT_CLASS}>
        Tap the heart on any menu item to save it here.
      </p>

      <Link href="/" className={EMPTY_LINK_CLASS}>
        Browse the menu
      </Link>
    </div>
  );
}